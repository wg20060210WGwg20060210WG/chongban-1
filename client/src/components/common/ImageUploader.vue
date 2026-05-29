<template>
  <div class="image-uploader">
    <div class="upload-list">
      <div v-for="(img, idx) in modelValue" :key="idx" class="upload-item">
        <img :src="resolveFileUrl(img)" class="upload-thumb" @error="$event.target.src = ''" />
        <button class="upload-remove" @click="removeAt(idx)" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div
        v-if="modelValue.length < max"
        class="upload-trigger"
        :class="{ uploading: uploading }"
        @click="triggerInput"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <input
          ref="inputRef"
          type="file"
          :accept="accept"
          :multiple="max > 1"
          hidden
          @change="onFileChange"
        />
        <div v-if="uploading" class="trigger-progress">
          <div class="progress-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#eee" stroke-width="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="#10B981" stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="94.2"
                :stroke-dashoffset="94.2 - (94.2 * progress) / 100"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <span class="progress-text">{{ progress }}%</span>
          </div>
        </div>
        <div v-else class="trigger-idle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#bbb" stroke-width="2" stroke-linecap="round" />
          </svg>
          <span class="trigger-hint">{{ modelValue.length ? '继续添加' : '上传图片' }}</span>
        </div>
      </div>
    </div>

    <p v-if="errorText" class="upload-error">{{ errorText }}</p>
    <p class="upload-tip" v-if="!errorText">
      支持 jpeg/png/gif/webp，单张不超过 {{ maxSizeMB }}MB
      <template v-if="max > 1">，最多 {{ max }} 张</template>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadImage } from '../../api/upload'
import { resolveFileUrl } from '../../utils/fileUrl'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 9 },
  maxSizeMB: { type: Number, default: 5 },
  accept: { type: String, default: 'image/jpeg,image/png,image/gif,image/webp' }
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const uploading = ref(false)
const progress = ref(0)
const errorText = ref('')

function triggerInput() {
  if (uploading.value) return
  errorText.value = ''
  inputRef.value?.click()
}

function validateFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    return '仅支持 jpeg/png/gif/webp 格式'
  }
  if (file.size > props.maxSizeMB * 1024 * 1024) {
    return `文件大小不能超过 ${props.maxSizeMB}MB`
  }
  return null
}

async function doUpload(file) {
  const err = validateFile(file)
  if (err) { errorText.value = err; return }

  const remaining = props.max - props.modelValue.length
  if (remaining <= 0) { errorText.value = `最多上传 ${props.max} 张`; return }

  uploading.value = true
  progress.value = 0
  errorText.value = ''

  try {
    const res = await uploadImage(file, (p) => { progress.value = p })
    const url = res.data?.url || res.data?.filename || ''
    if (url) {
      emit('update:modelValue', [...props.modelValue, url])
    }
  } catch (e) {
    errorText.value = e.message || '上传失败'
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

function onFileChange(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  doUpload(files[0])
  e.target.value = ''
}

function onDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) doUpload(file)
}

function removeAt(idx) {
  const next = [...props.modelValue]
  next.splice(idx, 1)
  emit('update:modelValue', next)
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.upload-item {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
}

.upload-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.upload-item:hover .upload-remove {
  opacity: 1;
}

.upload-trigger {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s;
  background: #fafafa;
}

.upload-trigger:hover {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.04);
}

.upload-trigger.uploading {
  border-color: #10B981;
  cursor: default;
}

.trigger-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.trigger-hint {
  font-size: 11px;
  color: #bbb;
}

.trigger-progress {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: relative;
  width: 40px;
  height: 40px;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
}

.progress-ring circle:last-child {
  transition: stroke-dashoffset 0.3s;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #10B981;
}

.upload-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #ef4444;
}

.upload-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #bbb;
}
</style>