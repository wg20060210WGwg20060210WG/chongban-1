<template>
  <div class="create-post-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>取消</span>
      </button>
      <h2>发布帖子</h2>
      <button
        class="publish-btn"
        :class="{ 'has-content': canPublish }"
        :disabled="!canPublish || publishing"
        @click="handlePublish"
      >
        <span v-if="publishing" class="publish-spinner"></span>
        <span>{{ publishing ? '发布中' : '发布' }}</span>
      </button>
    </div>

    <div class="form-area">
      <div class="title-field">
        <input
          v-model="title"
          class="title-input"
          placeholder="添加标题（选填）"
          maxlength="50"
        />
        <span class="title-count" :class="{ warn: title.length >= 45 }">{{ title.length }}/50</span>
      </div>

      <div class="textarea-field">
        <textarea
          v-model="content"
          class="content-textarea"
          placeholder="分享你和毛孩子的故事..."
          rows="6"
          maxlength="2000"
        ></textarea>
        <div class="char-count" :class="{ warn: content.length >= 1800 }">{{ content.length }}/2000</div>
      </div>

      <div class="image-section">
        <div class="image-grid">
          <div
            v-for="(img, idx) in imageUrls"
            :key="idx"
            class="image-thumb"
          >
            <img :src="img" alt="预览" />
            <button class="remove-img" @click="removeImage(idx)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="img-index">{{ idx + 1 }}</span>
          </div>
          <label
            v-if="imageUrls.length < 9"
            class="image-add"
            :class="{ uploading: uploading }"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              @change="handleFileSelect"
              :disabled="uploading"
              style="display: none"
            />
            <span v-if="uploading" class="upload-spinner"></span>
            <template v-else>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#b0b0c0" stroke-width="1.2"/>
                <path d="M12 8v8M8 12h8" stroke="#b0b0c0" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span class="add-text">{{ uploading ? '上传中...' : '添加图片' }}</span>
              <span class="add-count">{{ imageUrls.length }}/9</span>
            </template>
          </label>
        </div>
      </div>

      <div class="section-divider"></div>

      <div class="option-section">
        <div class="option-row">
          <span class="option-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.3"/>
              <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.3"/>
            </svg>
            选择频道 <span class="required-star">*</span>
          </span>
          <div class="channel-grid">
            <button
              v-for="ch in channels"
              :key="ch.value"
              class="channel-chip"
              :class="{ selected: channel === ch.value }"
              @click="channel = ch.value"
              type="button"
            >
              <span class="channel-icon">{{ ch.icon }}</span>
              <span class="channel-label">{{ ch.label }}</span>
            </button>
          </div>
        </div>

        <div class="option-row">
          <span class="option-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
            </svg>
            添加话题
          </span>
          <div class="topic-input-area">
            <div class="topic-tags" v-if="topics.length">
              <TransitionGroup name="tag-pop">
                <span v-for="(topic, idx) in topics" :key="topic" class="topic-tag">
                  #{{ topic }}
                  <button class="tag-remove" @click="removeTopic(idx)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                </span>
              </TransitionGroup>
            </div>
            <div class="topic-add-row">
              <input
                v-model="topicInput"
                class="topic-input"
                placeholder="输入话题名称，按回车添加"
                maxlength="20"
                @keydown.enter.prevent="addTopic"
              />
              <button
                class="topic-add-btn"
                :disabled="!topicInput.trim()"
                @click="addTopic"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                添加
              </button>
            </div>
            <div class="preset-topics">
              <span
                v-for="t in presetTopics"
                :key="t"
                class="preset-topic"
                :class="{ selected: topics.includes(t) }"
                @click="togglePresetTopic(t)"
              >#{{ t }}</span>
            </div>
          </div>
        </div>

        <div class="option-row">
          <span class="option-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M10 5.172C10 3.782 8.884 2.5 7.5 2.5S5 3.782 5 5.172C5 6.562 6.116 7.5 7.5 7.5S10 6.562 10 5.172z" stroke="currentColor" stroke-width="1.3"/>
              <path d="M14 13.172c0-1.39 1.116-2.672 2.5-2.672S19 11.782 19 13.172c0 1.39-1.116 2.328-2.5 2.328S14 14.562 14 13.172z" stroke="currentColor" stroke-width="1.3"/>
              <path d="M6 16c-1.5 0-4 .5-4 3v1h10v-1c0-2.5-2.5-3-4-3h-2z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              <path d="M18 16c1.5 0 4 .5 4 3v1H12v-1c0-2.5 2.5-3 4-3h2z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            关联宠物
          </span>
          <div class="pet-select-area">
            <div
              v-if="petStore.petList.length"
              class="pet-chips"
            >
              <div
                v-for="pet in petStore.petList"
                :key="pet._id"
                class="pet-chip"
                :class="{ selected: selectedPetId === pet._id }"
                @click="togglePet(pet)"
              >
                <span class="pet-avatar-mini">{{ pet.name[0] }}</span>
                <span class="pet-chip-name">{{ pet.name }}</span>
              </div>
              <div
                class="pet-chip no-pet-chip"
                :class="{ selected: !selectedPetId }"
                @click="clearPet"
              >不关联</div>
            </div>
            <p v-else class="no-pets">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ccc" stroke-width="1.2"/>
                <path d="M12 8v4M12 16h.01" stroke="#ccc" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              暂无宠物，<router-link to="/pets/add">去添加</router-link>
            </p>
          </div>
        </div>

        <div class="option-row">
          <span class="option-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" stroke-width="1.3"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.3"/>
            </svg>
            可见范围
          </span>
          <div class="visibility-pills">
            <button
              v-for="v in visibilityOptions"
              :key="v.value"
              class="vis-pill"
              :class="{ selected: visibility === v.value }"
              @click="visibility = v.value"
            >{{ v.icon }} {{ v.label }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { usePostStore } from '../../stores/post'
import { usePetStore } from '../../stores/pet'
import { useAuthStore } from '../../stores/auth'
import { uploadImages } from '../../api/post'

const router = useRouter()
const message = useMessage()
const postStore = usePostStore()
const petStore = usePetStore()
const authStore = useAuthStore()

const title = ref('')
const content = ref('')
const imageUrls = ref([])
const channel = ref('')
const topics = ref([])
const topicInput = ref('')
const selectedPetId = ref(null)
const selectedPetName = ref('')
const visibility = ref('public')
const publishing = ref(false)
const uploading = ref(false)
const submitAttempted = ref(false)

const channels = [
  { value: '猫咪日常', label: '猫咪', icon: '🐱' },
  { value: '狗狗日常', label: '狗狗', icon: '🐶' },
  { value: '萌宠瞬间', label: '萌宠日常', icon: '🐾' },
  { value: '养宠心得', label: '养宠攻略', icon: '📖' },
  { value: '求助问答', label: '求助问答', icon: '❓' },
  { value: '宠物健康', label: '宠物健康', icon: '💊' },
  { value: '宠物美食', label: '宠物美食', icon: '🍖' },
  { value: '遛弯日记', label: '遛弯日记', icon: '🚶' }
]

const presetTopics = ['可爱', '搞笑', '新手', '经验分享', '日常记录', '求推荐']

const visibilityOptions = [
  { value: 'public', label: '公开', icon: '🌍' },
  { value: 'followers', label: '粉丝', icon: '👥' },
  { value: 'private', label: '私密', icon: '🔒' }
]

const canPublish = computed(() => content.value.trim().length > 0 && channel.value !== '')

function goBack() {
  router.back()
}

async function handleFileSelect(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return

  const remaining = 9 - imageUrls.value.length
  const toUpload = files.slice(0, remaining)

  const maxSize = 5 * 1024 * 1024
  const invalid = toUpload.find(f => f.size > maxSize)
  if (invalid) {
    message.warning('图片大小不能超过5MB')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    toUpload.forEach(f => formData.append('files', f))
    const res = await uploadImages(formData)
    imageUrls.value.push(...res.data.urls)
  } catch (err) {
    message.error(err.message || '图片上传失败')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

function removeImage(idx) {
  imageUrls.value.splice(idx, 1)
}

function addTopic() {
  const t = topicInput.value.trim()
  if (!t) return
  if (topics.value.includes(t)) {
    message.warning('该话题已添加')
    return
  }
  if (topics.value.length >= 5) {
    message.warning('最多添加5个话题')
    return
  }
  topics.value.push(t)
  topicInput.value = ''
}

function removeTopic(idx) {
  topics.value.splice(idx, 1)
}

function togglePresetTopic(t) {
  const idx = topics.value.indexOf(t)
  if (idx !== -1) {
    topics.value.splice(idx, 1)
  } else if (topics.value.length < 5) {
    topics.value.push(t)
  }
}

function togglePet(pet) {
  if (selectedPetId.value === pet._id) {
    selectedPetId.value = null
    selectedPetName.value = ''
  } else {
    selectedPetId.value = pet._id
    selectedPetName.value = pet.name
  }
}

function clearPet() {
  selectedPetId.value = null
  selectedPetName.value = ''
}

async function handlePublish() {
  if (!canPublish.value || publishing.value) return
  if (!channel.value) {
    submitAttempted.value = true
    message.warning('请选择一个频道')
    return
  }

  publishing.value = true
  try {
    const data = {
      title: title.value.trim(),
      content: content.value.trim(),
      type: imageUrls.value.length > 0 ? 'image' : 'text',
      images: imageUrls.value,
      channel: channel.value,
      topics: topics.value,
      visibility: visibility.value
    }

    if (selectedPetId.value) {
      data.petTag = {
        petId: selectedPetId.value,
        petName: selectedPetName.value
      }
    }

    const post = await postStore.publishPost(data)
    message.success('发布成功！')
    router.replace(`/community/${post._id}`)
  } catch (err) {
    message.error(err.message || '发布失败')
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  if (petStore.petList.length === 0) {
    petStore.fetchMyPets()
  }
})
</script>

<style scoped>
.create-post-page {
  padding: 24px 0;
  min-height: calc(100vh - 120px);
  max-width: 720px;
  margin: 0 auto;
  animation: page-enter 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes page-enter {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 0 4px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: #10B981;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn:hover {
  background: rgba(16, 185, 129, 0.08);
  transform: translateX(-2px);
}

.page-header h2 {
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: 0.5px;
}

.publish-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #d0d5db, #b8bfc7);
  color: #fff;
  border: none;
  padding: 9px 24px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: 0.3px;
}

.publish-btn.has-content {
  background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%);
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
}

.publish-btn.has-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.publish-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.form-area {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04), 0 8px 32px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.title-field {
  position: relative;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f5f5f8;
}

.title-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 20px;
  font-weight: 800;
  color: #1a1a2e;
  background: transparent;
  padding: 4px 50px 4px 0;
  font-family: inherit;
  letter-spacing: 0.3px;
}

.title-input::placeholder {
  color: #d5d5e0;
  font-weight: 700;
}

.title-count {
  position: absolute;
  right: 0;
  bottom: 16px;
  font-size: 11px;
  color: #d0d0d0;
  transition: color 0.3s;
  font-weight: 500;
}

.title-count.warn {
  color: #f59e0b;
}

.textarea-field {
  margin-bottom: 18px;
}

.content-textarea {
  width: 100%;
  border: none;
  resize: vertical;
  font-size: 15px;
  line-height: 1.85;
  color: #444;
  outline: none;
  font-family: inherit;
  min-height: 130px;
  background: transparent;
}

.content-textarea::placeholder {
  color: #d0d0dd;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #d0d0d0;
  margin-top: 8px;
  transition: color 0.3s;
  font-weight: 500;
}

.char-count.warn {
  color: #f59e0b;
}

.image-section {
  margin-bottom: 4px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.image-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  animation: img-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(0, 0, 0, 0.04);
}

@keyframes img-pop {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.image-thumb:hover img {
  transform: scale(1.05);
}

.remove-img {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.image-thumb:hover .remove-img {
  opacity: 1;
}

.remove-img:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.15);
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
}

.img-index {
  position: absolute;
  bottom: 6px;
  left: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-add {
  aspect-ratio: 1;
  border: 2px dashed #e0e0ea;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(145deg, #fafbff, #f5f5fa);
}

.image-add:hover {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.04);
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
}

.image-add:hover svg rect,
.image-add:hover svg path {
  stroke: #10B981;
}

.image-add.uploading {
  pointer-events: none;
  opacity: 0.6;
}

.add-text {
  font-size: 12px;
  color: #b0b0c0;
  font-weight: 500;
}

.add-count {
  font-size: 11px;
  color: #d0d0d0;
  font-weight: 500;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e8e8ed;
  border-top-color: #10B981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.section-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e8e8f0, transparent);
  margin: 24px 0;
}

.option-section {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.2px;
}

.option-label svg {
  color: #10B981;
}

.required-star {
  color: #ef4444;
  font-size: 14px;
  margin-left: 2px;
}

.channel-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.channel-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1.5px solid #eeeef5;
  border-radius: 22px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.channel-chip:hover {
  border-color: rgba(16, 185, 129, 0.3);
  color: #10B981;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
}

.channel-chip.selected {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
}

.channel-icon {
  font-size: 16px;
}

.channel-label {
  font-weight: 600;
  letter-spacing: 0.2px;
}

.field-hint.error {
  color: #ef4444;
  font-size: 12px;
  margin: -4px 0 0;
}

.topic-input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #f0f9f4, #e8f5ee);
  color: #059669;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid rgba(16, 185, 129, 0.15);
  animation: tag-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.08);
}

@keyframes tag-enter {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.tag-pop-enter-active { animation: tag-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.tag-pop-leave-active { animation: tag-leave 0.2s ease; }

@keyframes tag-leave {
  to { transform: scale(0.7); opacity: 0; }
}

.tag-remove {
  background: none;
  border: none;
  color: #10B981;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
}

.tag-remove:hover {
  opacity: 1;
  background: rgba(16, 185, 129, 0.15);
  transform: scale(1.2);
}

.topic-add-row {
  display: flex;
  gap: 8px;
}

.topic-input {
  flex: 1;
  border: 1.5px solid #eeeef5;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafafe;
}

.topic-input:focus {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.08), 0 2px 12px rgba(16, 185, 129, 0.06);
  background: #fff;
}

.topic-add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f5f5f8;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  color: #888;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.topic-add-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.topic-add-btn:hover:not(:disabled) {
  background: #10B981;
  color: #fff;
}

.preset-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-topic {
  padding: 6px 14px;
  border: 1.5px solid #eeeef5;
  border-radius: 22px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.preset-topic:hover {
  border-color: rgba(16, 185, 129, 0.3);
  color: #10B981;
  background: rgba(16, 185, 129, 0.04);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
}

.preset-topic.selected {
  background: linear-gradient(135deg, #f0f9f4, #e8f5ee);
  border-color: rgba(16, 185, 129, 0.2);
  color: #059669;
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.08);
}

.pet-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pet-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1.5px solid #eeeef5;
  border-radius: 22px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.pet-chip:hover {
  border-color: rgba(16, 185, 129, 0.3);
  color: #10B981;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
}

.pet-avatar-mini {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  color: #10B981;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pet-chip.selected {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
}

.pet-chip.selected .pet-avatar-mini {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.no-pet-chip {
  font-size: 12px;
  color: #aaa;
}

.no-pets {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #b0b0c0;
  margin: 0;
}

.no-pets a {
  color: #10B981;
  text-decoration: none;
  font-weight: 600;
}

.no-pets a:hover {
  text-decoration: underline;
}

.visibility-pills {
  display: flex;
  gap: 10px;
}

.vis-pill {
  padding: 8px 18px;
  border: 1.5px solid #eeeef5;
  border-radius: 22px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-weight: 500;
}

.vis-pill:hover {
  border-color: rgba(16, 185, 129, 0.3);
  color: #10B981;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
}

.vis-pill.selected {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .create-post-page {
    padding: 14px 0;
  }

  .form-area {
    padding: 20px 16px;
    border-radius: 16px;
    margin: 0 4px;
  }

  .title-input {
    font-size: 18px;
  }

  .image-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .page-header {
    padding: 0 12px;
  }
}
</style>
