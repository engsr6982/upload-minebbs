# upload-minebbs

这是一个 GitHub Action，用于将 GitHub Release 自动同步到 MineBBS。

## 输入参数

输入参数：

| 参数名               | 描述                                              | 是否必须 | 默认值 |
| -------------------- | ------------------------------------------------- | -------- | ------ |
| `minebbs_token`      | MineBBS 的开发者 token                            | 是       | 空     |
| `upload_file`        | 需要上传的文件                                    | 是       | 空     |
| `resource_id`        | 需要更新的资源 ID                                 | 是       | 空     |
| `update_title`       | 更新标题(留空默认使用Release标题)                 | 否       | 空     |
| `update_description` | 更新描述(留空默认使用Release内容)                 | 否       | 空     |
| `update_version`     | 要更新的版本号(留空默认使用Tag)                   | 否       | 空     |
| `update_file_key`    | MineBBS 返回的 file_key(不用设置这个，无实际作用) | 否       | 空     |

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

            - name: Upload to MineBBS
              uses: engsr6982/upload-minebbs@v1 # 使用 upload-minebbs Action
              with:
                  minebbs_token: ${{ secrets.MINEBBS_TOKEN }} # 使用密钥
                  upload_file: path/to/your/file.zip # 指定上传文件的路径
                  resource_id: "12345" # 资源 ID
                  update_title: "New Release Title" # 更新标题
                  update_description: "Description of the new release" # 更新描述
                  update_version: "1.0.0" # 版本号
```
