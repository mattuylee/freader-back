//静态资源文件声明
// This will allow you to load `.json` files from disk

declare module "*.json"
{ const value: any;
  export default value;
}

// This will allow you to load JSON from remote URL responses

declare module "json!*"
{ const value: any;
  export default value;
}

declare module "*.svg" {
  const content: any;
  export default content;
}
