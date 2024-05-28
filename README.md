# upload-minebbs

这是一个 GitHub Action，用于将 GitHub Release 自动同步到 MineBBS。

## 输入参数

输入参数：

| 参数名               | 描述                                               | 是否必须 | 默认值 |
| -------------------- | -------------------------------------------------- | -------- | ------ |
| `minebbs_token`      | MineBBS 的开发者 token                             | 是       | 空     |
| `resource_id`        | 需要更新的资源 ID                                  | 是       | 空     |
| `use_extern_url`     | 是否使用外部链接                                   | 否       | false  |
| `custom_extern_url`  | 自定义外部下载链接地址(留空使用GitHub release地址) | 否       | 空     |
| `upload_file`        | 需要上传的文件                                     | 否       | 空     |
| `update_title`       | 更新标题(留空默认使用Release标题)                  | 否       | 空     |
| `update_description` | 更新描述(留空默认使用Release内容)                  | 否       | 空     |
| `update_version`     | 要更新的版本号(留空默认使用Tag)                    | 否       | 空     |

> [!warning]
>
> `use_extern_url` 和 `upload_file` 必须选择一个作为更新方式，否则更新失败  
> `upload_file` 提供的文件不能大于`10Mb`（API接口限制）

| API 允许上传的文件扩展名 |
| ------------------------ |
| .zip                     |
| .7z                      |
| rar                      |
| .tar                     |
| .pdf                     |
| .psd                     |
| .phar                    |
| .mcpack                  |
| .mcworld                 |
| .mcaddon                 |
| .jar                     |
| .apk                     |
| .exe                     |
| .js                      |
| .json                    |
| .dll                     |
| .py                      |
| .bnpx                    |

## 输出参数

| 参数名     | 描述                    |
| ---------- | ----------------------- |
| `file_key` | MineBBS 返回的 file_key |

## 使用示例

```yml
name: Sync Release to MineBBS

on:
    release:
        types: [created] # 当创建新的发布时触发

jobs:
    upload:
        runs-on: ubuntu-latest # 运行环境
        steps:
            - name: Checkout code
              uses: actions/checkout@v2 # 检出代码

            # 简单写法
            - name: Upload to MineBBS with upload_file
              uses: engsr6982/upload-minebbs@v1
              with:
                  minebbs_token: ${{ secrets.MINEBBS_TOKEN }} # 使用密钥
                  resource_id: "12345" # 资源 ID
                  upload_file: path/to/your/file.zip # 指定上传文件的路径

            # 使用外部链接
            - name: Upload to MineBBS with use_extern_url
              uses: engsr6982/upload-minebbs@v1
              with:
                  minebbs_token: ${{ secrets.MINEBBS_TOKEN }} # 使用密钥
                  resource_id: "12345" # 资源 ID
                  use_extern_url: true

            # 自定义写法
            - name: Upload to MineBBS with use_extern_url
              uses: engsr6982/upload-minebbs@v1
              with:
                  minebbs_token: ${{ secrets.MINEBBS_TOKEN }} # 使用密钥
                  resource_id: "12345" # 资源 ID
                  upload_file: path/to/your/file.zip # 指定上传文件的路径
                  update_title: "Github Actions Sync"
```

## 开发

-   更改 index.js 后，执行以下命令进行编译

```bash
npm i -g @vercel/ncc

ncc build index.js --license licenses.txt
```
