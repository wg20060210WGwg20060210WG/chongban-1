import axios from 'axios';
import { logError } from '../utils/helpers.js';

class AIService {
  constructor() {
    this.apiKey = process.env.MIMO_API_KEY || '';
    this.apiUrl = process.env.MIMO_API_URL || 'https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages';
    this.model = process.env.MIMO_MODEL || 'mimo-v2-pro';
    this._apiVerified = null; // null=未验证, true=可用, false=不可用
  }

  // Anthropic API 请求头
  getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    };
  }

  // 检查 API 是否配置
  isApiConfigured() {
    return !!(this.apiKey && this.apiKey.trim() !== '');
  }

  // 测试 API 是否真正可用（非阻塞，首次调用时验证）
  async verifyApi() {
    if (this._apiVerified !== null) return this._apiVerified;
    if (!this.isApiConfigured()) {
      this._apiVerified = false;
      return false;
    }
    try {
      console.log('[AI] 正在验证 MIMO API 连通性...');
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          max_tokens: 64,
          messages: [{ role: 'user', content: 'hi' }]
        },
        {
          headers: this.getHeaders(),
          timeout: 15000
        }
      );
      const data = response.data;
      // MIMO 返回 thinking + text 两种 content block，任一存在即算可用
      const hasContent = Array.isArray(data?.content) && data.content.length > 0;
      const ok = response.status === 200 && hasContent;
      this._apiVerified = ok;
      console.log(`[AI] MIMO API 验证结果: ${ok ? '✅ 可用' : '❌ 响应异常'}`);
      if (!ok) console.log('[AI] 响应内容:', JSON.stringify(data).slice(0, 200));
      return ok;
    } catch (err) {
      this._apiVerified = false;
      console.error('[AI] MIMO API 验证失败:', err.response?.status, err.response?.data?.error?.message || err.message);
      return false;
    }
  }

  // 从 MIMO API 响应中提取文本内容（跳过 thinking block）
  extractTextFromContent(content) {
    if (!Array.isArray(content)) return '';
    const textBlock = content.find(b => b.type === 'text' && b.text);
    return textBlock?.text || '';
  }

  // 流式AI问诊
  async consultPetStream(symptoms, petInfo, { duration, severity }, onChunk, onDone) {
    const prompt = this.buildConsultPrompt(symptoms, petInfo, { duration, severity });

    // 先验证 API 是否可用
    const apiOk = await this.verifyApi();

    if (apiOk) {
      try {
        console.log('[AI] 问诊 - 调用 MIMO API...');
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            max_tokens: 1024,
            system: '你是一名经验丰富的宠物医生。请根据用户描述的症状进行分析，给出专业建议。注意：你的分析仅供参考，不能替代专业兽医诊断。',
            messages: [
              { role: 'user', content: prompt }
            ],
            stream: true
          },
          {
            headers: this.getHeaders(),
            timeout: 60000,
            responseType: 'stream'
          }
        );

        let fullContent = '';
        let doneCalled = false;
        const safeOnDone = (content) => {
          if (doneCalled) return;
          doneCalled = true;
          onDone(content);
        };

        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              continue;
            }
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullContent += parsed.delta.text;
                  onChunk(parsed.delta.text);
                }
                if (parsed.type === 'message_stop') {
                  console.log('[AI] 问诊 - API 响应完成，长度:', fullContent.length);
                  safeOnDone(fullContent);
                  return;
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        });

        response.data.on('end', () => {
          safeOnDone(fullContent);
        });

        return;
      } catch (apiError) {
        console.error('[AI] 问诊 API 调用失败:', apiError.response?.status, apiError.response?.data?.error?.message || apiError.message);
        logError('AI_STREAM_API_CALL')(apiError);
        // API 调用失败，重置验证状态以便下次重试
        this._apiVerified = false;
      }
    } else {
      console.log('[AI] 问诊 - API 不可用，使用模拟数据');
    }

    // 降级：使用模拟响应，明确告知用户
    const disclaimer = '⚠️ 提示：AI 服务暂时不可用，以下是基于常见症状的参考分析，并非专业诊断。如需准确判断，请咨询专业兽医。\n\n';
    onChunk(disclaimer);

    const mockResponse = this.getMockConsultResponse(symptoms, severity, petInfo);
    const chunks = mockResponse.match(/.{1,20}/g) || [mockResponse];
    let fullContent = disclaimer;
    for (const chunk of chunks) {
      fullContent += chunk;
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    onDone(fullContent);
  }

  // 流式养宠指南
  async getPetGuideStream(petInfo, guideType, onChunk, onDone) {
    const typePrompts = {
      feeding: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）制定详细的喂养方案，包括食物种类、喂养频率、食量建议、禁忌食物等。`,
      training: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）提供训练指南，包括基础训练项目、训练方法、注意事项等。`,
      health: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）提供健康管理指南，包括日常保健、疫苗接种、体检建议等。`,
      behavior: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）提供行为指导，包括常见行为问题及解决方案。`
    };

    const prompt = typePrompts[guideType] || typePrompts.feeding;

    // 先验证 API 是否可用
    const apiOk = await this.verifyApi();

    if (apiOk) {
      try {
        console.log('[AI] 指南 - 调用 MIMO API...');
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            max_tokens: 1024,
            system: '你是一名专业的宠物养护专家，擅长提供科学的养宠建议。',
            messages: [
              { role: 'user', content: prompt }
            ],
            stream: true
          },
          {
            headers: this.getHeaders(),
            timeout: 60000,
            responseType: 'stream'
          }
        );

        let fullContent = '';
        let doneCalled = false;
        const safeOnDone = (content) => {
          if (doneCalled) return;
          doneCalled = true;
          onDone(content);
        };

        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullContent += parsed.delta.text;
                  onChunk(parsed.delta.text);
                }
                if (parsed.type === 'message_stop') {
                  console.log('[AI] 指南 - API 响应完成，长度:', fullContent.length);
                  safeOnDone(fullContent);
                  return;
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        });

        response.data.on('end', () => {
          safeOnDone(fullContent);
        });

        return;
      } catch (apiError) {
        console.error('[AI] 指南 API 调用失败:', apiError.response?.status, apiError.response?.data?.error?.message || apiError.message);
        logError('AI_GUIDE_STREAM_API_CALL')(apiError);
        this._apiVerified = false;
      }
    } else {
      console.log('[AI] 指南 - API 不可用，使用模拟数据');
    }

    // 降级：使用模拟响应，明确告知用户
    const disclaimer = '⚠️ 提示：AI 服务暂时不可用，以下为通用养宠参考建议。如需个性化指导，建议咨询专业宠物医生。\n\n';
    onChunk(disclaimer);

    const mockResponse = this.getMockGuideResponse(guideType, petInfo);
    const chunks = mockResponse.match(/.{1,20}/g) || [mockResponse];
    let fullContent = disclaimer;
    for (const chunk of chunks) {
      fullContent += chunk;
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    onDone(fullContent);
  }

  // 构建问诊prompt
  buildConsultPrompt(symptoms, petInfo, { duration, severity }) {
    return `
你是一名专业的宠物医生。现在有一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）出现了以下症状：

症状：${symptoms}
持续时间：${duration || '未知'}
严重程度：${severity || '中等'}

请分析可能的疾病原因，并给出建议。

请按以下格式回复：

1. 可能的疾病：列出2-3种可能性，并标注概率（0-100）和简要描述
2. 综合建议：给用户的完整建议
3. 是否需要就医：是/否
4. 紧急程度：低/中/高
5. 居家护理建议：具体的居家护理建议

注意：你的分析仅供参考，不能替代专业兽医诊断。
    `;
  }

  // 提取疾病信息（简化实现）
  extractDiseases(text) {
    const lowerText = text.toLowerCase();
    
    const diseaseMatches = [
      {
        keywords: ['呕吐', '腹泻', '拉稀', '反胃', '肠胃'],
        diseases: [
          { name: '肠胃炎', probability: 65, description: '根据呕吐、腹泻等症状，可能是消化道感染' },
          { name: '消化不良', probability: 30, description: '可能是饮食不当引起的轻微消化问题' }
        ]
      },
      {
        keywords: ['皮肤', '痒', '脱毛', '红疹', '皮屑', '过敏'],
        diseases: [
          { name: '皮肤过敏/皮炎', probability: 60, description: '可能是食物过敏、环境过敏或寄生虫感染' },
          { name: '真菌/细菌感染', probability: 25, description: '可能需要皮肤刮片检查确认' }
        ]
      },
      {
        keywords: ['感冒', '打喷嚏', '流鼻涕', '咳嗽', '发烧', '发热'],
        diseases: [
          { name: '上呼吸道感染', probability: 55, description: '可能是病毒或细菌感染引起的感冒症状' },
          { name: '支气管炎/肺炎', probability: 30, description: '需要密切观察，如果症状加重请就医' }
        ]
      },
      {
        keywords: ['跛行', '腿瘸', '关节', '骨折', '受伤', '疼痛', '瘸'],
        diseases: [
          { name: '关节炎/关节损伤', probability: 50, description: '可能是关节炎、韧带拉伤或骨折' },
          { name: '外伤/扭伤', probability: 35, description: '建议限制活动，观察病情变化' }
        ]
      }
    ];

    for (const match of diseaseMatches) {
      if (match.keywords.some(keyword => lowerText.includes(keyword))) {
        return match.diseases;
      }
    }

    return [
      { name: '待诊症状', probability: 50, description: '请观察症状变化，如有加重请就医' },
      { name: '一般不适', probability: 25, description: '可能是轻微不适，建议继续观察' }
    ];
  }

  // 提取紧急程度
  extractUrgency(text) {
    const negationPatterns = ['不太紧急', '不紧急', '不太严重', '不严重', '无需紧急', '不必紧急'];
    const hasNegation = negationPatterns.some(neg => text.includes(neg));
    if (hasNegation) return 'low';

    if (text.includes('紧急') || text.includes('立即') || text.includes('严重') || text.includes('危急')) {
      return 'high';
    }
    if (text.includes('尽快') || text.includes('注意') || text.includes('中等') || text.includes('较重')) {
      return 'medium';
    }
    return 'low';
  }

  // 提取居家护理建议
  extractHomeCareTips(text) {
    const match = text.match(/居家护理建议[：:]([\s\S]*?)(?=注意事项|$)/i);
    if (match) {
      return match[1].trim();
    }
    return '请密切观察宠物状态，保持充足饮水，如症状加重请立即就医。';
  }

  // 判断是否需要就医
  extractNeedsVet(text) {
    return text.includes('需要就医') || text.includes('立即就医') || text.includes('建议就医');
  }

  // AI问诊（非流式）
  async consultPet(symptoms, petInfo, { duration, severity }) {
    try {
      const prompt = this.buildConsultPrompt(symptoms, petInfo, { duration, severity });

      let aiResponse;
      let isMock = false;
      const apiOk = await this.verifyApi();

      if (apiOk) {
        try {
          console.log('[AI] 非流式问诊 - 调用 MIMO API...');
          const response = await axios.post(
            this.apiUrl,
            {
              model: this.model,
              max_tokens: 1024,
              system: '你是一名经验丰富的宠物医生，擅长诊断猫狗常见疾病。',
              messages: [
                { role: 'user', content: prompt }
              ]
            },
            {
              headers: this.getHeaders(),
              timeout: 30000
            }
          );
          aiResponse = this.extractTextFromContent(response.data.content);
          console.log('[AI] 非流式问诊 - API 响应成功，长度:', aiResponse.length);
        } catch (apiError) {
          console.error('[AI] 非流式问诊 API 失败:', apiError.response?.status, apiError.message);
          logError('AI_API_CALL')(apiError);
          aiResponse = this.getMockConsultResponse(symptoms, severity, petInfo);
          isMock = true;
          this._apiVerified = false;
        }
      } else {
        aiResponse = this.getMockConsultResponse(symptoms, severity, petInfo);
        isMock = true;
      }

      if (isMock) {
        aiResponse = '⚠️ 提示：AI 服务暂时不可用，以下是基于常见症状的参考分析，并非专业诊断。\n\n' + aiResponse;
      }

      return {
        analysis: {
          possibleDiseases: this.extractDiseases(aiResponse),
          suggestions: aiResponse,
          needsVet: this.extractNeedsVet(aiResponse),
          urgency: this.extractUrgency(aiResponse),
          homeCareTips: this.extractHomeCareTips(aiResponse),
          isMock
        },
        apiResponse: aiResponse
      };
    } catch (error) {
      logError('AI_CONSULT')(error);
      throw new Error('AI服务暂时不可用，请稍后再试');
    }
  }

  // 获取模拟问诊响应
  getMockConsultResponse(symptoms, severity, petInfo = {}) {
    const species = (petInfo.species || '宠物').toLowerCase();
    const isCat = species.includes('猫');
    const isDog = species.includes('狗');

    const diseases = isCat
      ? `- 猫肠胃炎，概率50%，可能是饮食变化或毛球症引起\n- 猫瘟/猫传腹早期，概率25%，需要排查\n- 消化不良，概率25%，可能是食物不耐受`
      : isDog
      ? `- 犬肠胃炎，概率50%，可能是饮食不当引起\n- 细小病毒早期，概率20%，需要排查\n- 消化不良，概率30%，可能是食物过敏`
      : `- 轻度消化不适，概率50%，可能是饮食变化引起\n- 肠胃炎，概率35%，可能是细菌感染\n- 其他轻微问题，概率15%`;

    const careAdvice = isCat
      ? `- 保持猫砂盆清洁\n- 少量多餐，可尝试处方罐头\n- 观察是否伴随呕吐毛球\n- 如症状加重或持续超过12小时，请立即就医`
      : isDog
      ? `- 确保充足饮水，防止脱水\n- 少量多餐易消化的食物（如鸡胸肉+米饭）\n- 避免喂食零食和人类食物\n- 如症状加重或持续超过24小时，请立即就医`
      : `- 确保充足饮水\n- 少量多餐易消化的食物\n- 观察症状变化\n- 如症状加重或持续超过24小时，请立即就医`;

    return `
1. 可能的疾病：
${diseases}

2. 综合建议：请密切观察宠物状态，确保提供清洁饮水，暂时避免喂食不易消化的食物。

3. 是否需要就医：${severity === 'severe' ? '是' : '否'}

4. 紧急程度：${severity === 'severe' ? 'high' : severity === 'moderate' ? 'medium' : 'low'}

5. 居家护理建议：
${careAdvice}

注意：以上分析仅供参考，不能替代专业兽医诊断。
    `;
  }

  // AI养宠指南（非流式）
  async getPetGuide(petInfo, guideType) {
    try {
      const typePrompts = {
        feeding: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）制定详细的喂养方案，包括食物种类、喂养频率、食量建议、禁忌食物等。`,
        training: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）提供训练指南，包括基础训练项目、训练方法、注意事项等。`,
        health: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）提供健康管理指南，包括日常保健、疫苗接种、体检建议等。`,
        behavior: `请为一只${petInfo.species || '宠物'}（品种：${petInfo.breed || '未知'}）提供行为指导，包括常见行为问题及解决方案。`
      };

      const prompt = typePrompts[guideType] || typePrompts.feeding;

      let guideText;
      let isMock = false;
      const apiOk = await this.verifyApi();

      if (apiOk) {
        try {
          console.log('[AI] 非流式指南 - 调用 MIMO API...');
          const response = await axios.post(
            this.apiUrl,
            {
              model: this.model,
              max_tokens: 1024,
              system: '你是一名专业的宠物养护专家，擅长提供科学的养宠建议。',
              messages: [
                { role: 'user', content: prompt }
              ]
            },
            {
              headers: this.getHeaders(),
              timeout: 30000
            }
          );
          guideText = this.extractTextFromContent(response.data.content);
          console.log('[AI] 非流式指南 - API 响应成功，长度:', guideText.length);
        } catch (apiError) {
          console.error('[AI] 非流式指南 API 失败:', apiError.response?.status, apiError.message);
          logError('AI_GUIDE_API_CALL')(apiError);
          guideText = this.getMockGuideResponse(guideType, petInfo);
          isMock = true;
          this._apiVerified = false;
        }
      } else {
        guideText = this.getMockGuideResponse(guideType, petInfo);
        isMock = true;
      }

      if (isMock) {
        guideText = '⚠️ 提示：AI 服务暂时不可用，以下为通用养宠参考建议。\n\n' + guideText;
      }

      return guideText;
    } catch (error) {
      logError('AI_GUIDE')(error);
      throw new Error('AI服务暂时不可用，请稍后再试');
    }
  }

  // 获取模拟指南响应
  getMockGuideResponse(guideType, petInfo) {
    const guides = {
      feeding: `
## ${petInfo.species || '宠物'}喂养指南

### 1. 食物推荐
- 优质商用${petInfo.species || '宠物'}粮
- 适当添加新鲜肉类
- 确保提供充足清洁饮水

### 2. 喂养频率
- 成年宠物：一天2次
- 幼年宠物：一天3-4次

### 3. 禁忌食物
- 巧克力、咖啡因
- 洋葱、大蒜
- 葡萄、葡萄干
- 过咸、过甜的食物

注意：以上建议仅供参考，请根据宠物实际情况调整。
      `,
      training: `
## ${petInfo.species || '宠物'}训练指南

### 基础训练
- 基础服从训练
- 社交化训练
- 良好习惯培养

### 训练方法
- 正面强化
- 耐心引导
- 循序渐进

注意：请根据宠物品种和性格特点调整训练方案。
      `,
      health: `
## ${petInfo.species || '宠物'}健康管理指南

### 日常保健
- 定期体检
- 按时接种疫苗
- 定期驱虫
- 口腔护理

### 健康观察
- 观察食欲变化
- 监测体重
- 注意精神状态

建议：每年至少一次全面体检。
      `,
      behavior: `
## ${petInfo.species || '宠物'}行为指导

### 常见行为问题及解决方案
- 分离焦虑
- 过度吠叫
- 破坏性行为

### 应对方法
- 给予足够关注
- 提供适当玩具
- 建立规律作息

注意：严重行为问题建议咨询专业训犬师或宠物行为专家。
      `
    };

    return guides[guideType] || guides.feeding;
  }
}

export default new AIService();