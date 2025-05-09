<template>
  <el-config-provider size="default">
    <el-form label-position="top" label-width="auto" class="w-80%">
      <el-form-item label="游戏根目录：">
        <el-input v-model="settings.gameRoot" :spellcheck="false">
          <template #append>
            <el-button icon="Folder" @click="showFolderPicker" />
          </template>
        </el-input>
        <el-text type="info" size="small">
          当你没有填写此项时，拖拽mod将不会为您复制到游戏mods文件夹
        </el-text>
      </el-form-item>
      <el-form-item label="添加卡片或zipmod时行为: ">
        <div>
          <el-radio-group v-model="settings.isCopyFile" class="block h-30px">
            <el-radio :value="true">复制</el-radio>
            <el-radio :value="false">移动</el-radio>
          </el-radio-group>
          <el-text type="info" size="small" class="block">添加卡片和zipmod时是否保留源文件</el-text>
        </div>
      </el-form-item>

      <div>
        <div class="flex gap-2">
          <el-link
            underline="never"
            @click.prevent="openLinkBrowser('https://github.com/Mesimpler/haremdb')"
          >
            Open Source Github
          </el-link>
        </div>
        <div class="flex gap-2">
          <el-text>v{{ version }}</el-text>
          <el-link
            underline="never"
            @click.prevent="openLinkBrowser('https://github.com/Mesimpler/haremdb/releases')"
          >
            检查更新
          </el-link>
        </div>
      </div>
    </el-form>
  </el-config-provider>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'

const settings = inject('app-settings', {})

function showFolderPicker() {
  window.electron.ipcRenderer
    .invoke('showOpenDialog', {
      properties: ['openDirectory']
    })
    .then((dirs) => {
      if (dirs && dirs[0]?.path) {
        settings.value.gameRoot = dirs[0].path
      }
    })
}

const version = ref('')
onMounted(async () => {
  version.value = await window.electron.ipcRenderer.invoke('get-app-version')
})

function openLinkBrowser(url) {
  window.electron.ipcRenderer.invoke('openExternalLink', url)
}
</script>

<style scoped></style>
