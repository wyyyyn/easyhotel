import type { UserConfigExport } from '@tarojs/cli';

export default {
  mini: {},
  h5: {
    /**
     * WebpackChain 插件配置
     * 生产环境可在此配置额外的优化选项
     */
  },
} satisfies UserConfigExport<'webpack5'>;
