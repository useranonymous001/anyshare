const notAllowedMimeTypes = [
  "application/x-msdownload", // .exe
  "application/x-msdos-program", // .bat, .cmd
  "application/x-ms-installer", // .msi
  "application/java-archive", // .jar
  "application/x-sharedlib", // .so
  "application/x-object", // .o, .obj
  "application/javascript", // .js
  "text/javascript", // .js
  "application/x-php", // .php
  "application/x-python-code", // .py
  "application/x-ruby", // .rb
  "application/x-perl", // .pl
  "application/vnd.ms-excel", // .xls
  "application/vnd.ms-word", // .doc
  "application/vnd.ms-powerpoint", // .ppt
  "application/x-rar-compressed", // .rar
  "application/x-7z-compressed", // .7z
  "application/zip", // .zip
  "application/gzip", // .gz
  "application/x-tar", // .tar
];

const notAllowedExtensions = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".bin",
  ".msi",
  ".jar",
  ".com",
  ".scr",
  ".pif",
  ".vb",
  ".vbs",
  ".js",
  ".php",
  ".py",
  ".rb",
  ".pl",
  ".cgi",
  ".asp",
  ".aspx",
  ".jsp",
  ".docm",
  ".xlsm",
  ".pptm",
  ".dotm",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",
];

module.exports = { notAllowedExtensions, notAllowedMimeTypes };
