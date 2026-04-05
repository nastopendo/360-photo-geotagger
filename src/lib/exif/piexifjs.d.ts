declare module 'piexifjs' {
  type ExifData = Record<string, Record<number | string, unknown>>

  function load(jpegDataUrl: string): ExifData
  function dump(exifObj: ExifData): string
  function insert(exifStr: string, jpegDataUrl: string): string
  function remove(jpegDataUrl: string): string

  const _default: {
    load: typeof load
    dump: typeof dump
    insert: typeof insert
    remove: typeof remove
  }
  export default _default
  export { load, dump, insert, remove }
}
