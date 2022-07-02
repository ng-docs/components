# Deploy to local

# 部署到本地环境

有些企业内部的防火墙比较严格，如果无法打开 https://material.angular.cn，你可以在企业内部进行私有化部署。步骤如下：

本文档的预编译版本位于 [Github](https://github.com/ng-docs/material-cn-prebuilt) 上，如果你想进行私有化部署，请把它 Clone 下来，在 nginx 等服务器上按照静态网站的形式做部署即可，除此之外不需要任何服务端环境。

以 Nginx 为例，你需要在 nginx 上做如下改动：

```
server {
    root /path/to/material-cn-prebuilt/;
    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }
}
```

注意其中的 `$uri.html`，这是本文档相对于常规 Angular 应用的主要差别，因为本文档进行了预先渲染（Prerender），这项工作可以让你在不需要 Node 服务器的情况下获得等同于服务端渲染的体验改善。
