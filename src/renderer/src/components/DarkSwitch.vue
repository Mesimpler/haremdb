<template>
  <el-switch
    v-model="isDark"
    size="large"
    active-action-icon="Moon"
    inactive-action-icon="Sunny"
    @click="onSwitchTheme"
  />
</template>

<script setup>
import { onMounted } from 'vue'
import { useDark } from '@vueuse/core'

const isDark = useDark()

onMounted(() => {
  onSwitchTheme()
})

function onSwitchTheme() {
  if (isDark.value) {
    window.electron.ipcRenderer.send('changeWinbar', {
      symbolColor: '#E5EAF3'
    })
  } else {
    window.electron.ipcRenderer.send('changeWinbar', {
      symbolColor: '#909399'
    })
  }
}
</script>

<style scoped>
.el-switch {
  /* 黑夜模式 */
  --el-switch-on-color: var(--el-border-color-lighter);
  /* 白天模式 */
  --el-switch-off-color: var(--el-border-color-darker);
}
</style>
