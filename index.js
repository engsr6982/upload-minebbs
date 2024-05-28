const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const input = {
    /**
     * MineBBS 开发者 Token
     * @type {string}
     */
    minebbs_token: core.getInput("minebbs_token", { required: true }),
    /**
     * 资源 ID
     * @type {number}
     */
    resource_id: core.getInput("resource_id", { required: true }),
    /**
     * 是否使用外部链接(默认false)
     * @type {boolean}
     */
    use_extern_url: core.getInput("use_extern_url", { required: false }),
    /**
     * 自定义外部下载链接地址
     * @type {string}
     */
    custom_extern_url: core.getInput("custom_extern_url", { required: false }),
    /**
     * 要上传的文件
     * @type {string}
     */
    upload_file: core.getInput("upload_file", { required: false }),
    /**
     * 更新标题
     * @type {string}
     */
    update_title: core.getInput("update_title", { required: false }),
    /**
     * 更新描述
     * @type {string}
     */
    update_description: core.getInput("update_description", {
        required: false,
    }),
    /**
     * 更新版本
     * @type {string}
     */
    update_version: core.getInput("update_version", { required: false }),
};

// 错误映射表
const uploadStatusCodeMap = {
    2000: "成功",
    4002: "没有上传文件",
    4003: "上传文件数量超过限制",
    4004: "上传的文件类型不被允许",
    4005: "上传的文件大小超过限制",
    5000: "服务器出错",
};
const updateStatusCodeMap = {
    2000: "成功",
    4000: "请提交正确的资源ID/无法解析Json/请提交正确的文件key",
    4030: "没有操作指定资源的权限",
    5000: "服务器出错",
};

// 生成请求头（Token）
function getGeneratorHeader() {
    return {
        headers: {
            Authorization: "Bearer " + input.minebbs_token,
        },
    };
}

// 请求到的 file_key
let request_file_key = null;

// 请求上传文件
function requestUploadFile() {
    const formData = new FormData();
    const fileStream = fs.createReadStream(path.resolve(input.upload_file));
    formData.append("upload[]", fileStream);

    const options = {
        headers: {
            ...getGeneratorHeader().headers,
            ...formData.getHeaders(),
        },
    };

    axios
        .post(
            "https://api.minebbs.com/api/openapi/v1/upload/",
            formData,
            options,
        )
        .then((response) => {
            if (response.data.status === 2000) {
                request_file_key = response.data.data[0];
                core.setOutput("file_key", response.data.data[0]);
                core.info(`文件上传成功, file_key: ${response.data.data[0]}`);
            } else {
                core.setFailed(
                    `上传文件失败, 错误原因: ${uploadStatusCodeMap[response.data.status]}`,
                );
            }
        })
        .catch((error) => {
            core.setFailed("请求上传文件失败，失败原因: " + error.message);
        });
}

// 请求更新资源
function requestUpdateResource() {
    const url = `https://api.minebbs.com/api/openapi/v1/resources/${input.resource_id}/update`;
    let body = {};

    const release = github.context.release;

    body.title = input.update_title || release.name; // 标题（默认Release名称）
    body.description = input.update_description || release.body; // 更新内容（默认Release内容）
    body.new_version =
        input.update_version || github.context.payload.release.tag_name; // 新版本号（默认tag）
    // 根据 use_extern_url配置file_key
    body.file_key = input.use_extern_url
        ? ""
        : input.update_file_key || request_file_key; // 文件 Key

    body.file_url = input.use_extern_url
        ? input.custom_extern_url ||
          `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/releases`
        : "";

    axios
        .post(url, body, getGeneratorHeader())
        .then((res) => {
            if (!res.data.status === 2000) {
                core.setFailed(
                    `请求更新资源失败，原因：${updateStatusCodeMap[res.data.status]}`,
                );
            }
        })
        .catch((e) => {
            core.setFailed("请求更新资源失败，失败原因: " + e.message);
        });
}

// 主函数
function main() {
    // 调试，打印信息
    core.debug(`upload_file: ${input.upload_file}`);
    core.debug(`resource_id: ${input.resource_id}`);
    core.debug(`update_title: ${input.update_title}`);
    core.debug(`update_description: ${input.update_description}`);
    core.debug(`update_version: ${input.update_version}`);
    core.debug(`update_file_key: ${input.update_file_key}`);
    // 检查输入数据
    if (input.minebbs_token == "" || input.minebbs_token == null) {
        core.setFailed("请提供 MineBBS 开发者 Token!");
        return;
    }
    if (input.resource_id == "" || input.resource_id == null) {
        core.setFailed("请提供资源 ID!");
        return;
    }
    // 开始请求
    if (!input.use_extern_url) {
        // 不使用外部链接，则上传文件
        if (!fs.existsSync(path.resolve(input.upload_file))) {
            // 检查文件是否存在
            core.setFailed("文件不存在, 请检查 upload_file!");
            return;
        }
        requestUploadFile(); // 开始上传
    }
    requestUpdateResource();
}

main();
