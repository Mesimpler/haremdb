<template>
  <div class="titlebar" v-bind="$attrs"></div>
</template>

<script setup></script>

<style scoped>
.titlebar {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 340px;
  top: 0;
  right: 200px;
  opacity: 0;
  z-index: 999;
  background-color: var(--el-color-primary);
  app-region: drag;
}
</style>
