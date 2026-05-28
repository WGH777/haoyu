<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
  </el-config-provider>
</template>

<script lang="ts">
import { ElConfigProvider } from "element-plus";
import { defineComponent, computed, watch } from "vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider
  },
  setup() {
    const currentLocale = computed(() => zhCn);

    watch(
      () => currentLocale.value,
      () => { /* locale changed */ }
    );

    return { currentLocale };
  }
});
</script>

<style>
/* HaoYu 管理后台全局样式 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
