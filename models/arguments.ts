export default interface Arguments {
  sourcePath: string;
  proxyLocation: string;
  backupLocation: string;
  restore: boolean;
  glob?: string;
  watch?: string;
  watchDebounce: number;
  ignore?: string;
  ignoreDot: boolean;
}
