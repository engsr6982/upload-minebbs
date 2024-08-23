import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

import core from "@actions/core";
import github from "@actions/github";

class Input {
    /**
     * 获取 MineBBS Token
     * @returns {string}
     */
    static GetToken() {
        return core.getInput("minebbs_token", { required: true });
    }

    /**
     * 获取资源ID
     * @returns {string}
     */
    static GetResourceID() {
        const id = core.getInput("resource_id", { required: true });
        core.debug(`resource_id: ${id}`);
        return id;
    }

    /**
     * @returns {boolean}
     */
    static IsUseExternURL() {
        const bool = core.getInput("use_extern_url", { required: false });
        core.debug(`use_extern_url: ${bool}`);
        return Object.prototype.toString.call(bool) === "[object Boolean]"
            ? bool
            : bool == "true"
              ? true
              : false;
    }

    /**
     * @returns {string | null}
     */
    static GetCustomExternURL() {
        const url = core.getInput("custom_extern_url", { required: false });
        core.debug(`custom_extern_url: ${url}`);
        if (url == "" || url == null) {
            return null;
        } else {
            return url;
        }
    }

    /**
     * @returns {string | null}
     */
    static GetUploadFile() {
        const file = core.getInput("upload_file", { required: false });
        core.debug(`upload_file: ${file}`);
        if (file == "" || file == null) {
            return null;
        } else {
            return file;
        }
    }

    /**
     * @returns {string}
     */
    static GetUpdateTitle() {
        const data = core.getInput("update_title", { required: false });
        core.debug(`update_title: ${data}`);
        if (data == "" || data == null) {
            return github.context.payload.release.name;
        } else {
            return data;
        }
    }

    /**
     * @returns {string}
     */
    static GetUpdateDescription() {
        const data = core.getInput("update_description", { required: false });
        core.debug(`update_description: ${data}`);
        if (data == "" || data == null) {
            return github.context.payload.release.body;
        } else {
            return data;
        }
    }

    /**
     * @returns {string}
     */
    static GetUpdateVersion() {
        const v = core.getInput("update_version", { required: false });
        core.debug(`update_version: ${v}`);
        if (v == "" || v == null) {
            return github.context.payload.release.tag_name;
        } else {
            return v;
        }
    }
}

class UploadMineBBS {
    UploadStatusCodeMap = {
        2000: "成功",
        4002: "没有上传文件",
        4003: "上传文件数量超过限制",
        4004: "上传的文件类型不被允许",
        4005: "上传的文件大小超过限制",
        5000: "服务器出错",
    };
    UpdateStatusCodeMap = {
        400: "Token 已过期",
        2000: "成功",
        4000: "请提交正确的资源ID/无法解析Json/请提交正确的文件key",
        4030: "没有操作指定资源的权限",
        5000: "服务器出错",
    };

    /** @type {string} */ FileKey = undefined;

    GeneratorRequestHeader() {
        return {
            headers: {
                Authorization: `Bearer ${Input.GetToken()}`,
            },
        };
    }

    GeneratorRepoURL() {
        return `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/releases`;
    }

    async RequestUploadFile() {
        const formData = new FormData();
        const fileStream = fs.createReadStream(
            path.resolve(Input.GetUploadFile()),
        );
        formData.append("upload[]", fileStream); // 上传文件

        const options = {
            headers: {
                ...this.GeneratorRequestHeader().headers, // 展开请求头
                ...formData.getHeaders(), // 展开文件上传请求头
            },
        };

        const response = await axios.post(
            "https://api.minebbs.com/api/openapi/v1/upload/",
            formData,
            options,
        );

        if (response.data.status === 2000) {
            this.FileKey = response.data.data[0];
            core.debug(`FileKey: ${response.data.data[0]}`);
        } else {
            core.setFailed(
                `上传文件失败，状态码: ${response.data.status} => ${
                    this.UploadStatusCodeMap[response.data.status]
                }`,
            );
            return;
        }
        core.info(`上传文件成功`);
    }

    async RequestUpdateResource() {
        const url = `https://api.minebbs.com/api/openapi/v1/resources/${Input.GetResourceID()}/update`;
        const body = {
            title: Input.GetUpdateTitle(),
            description: Input.GetUpdateDescription(),
            new_version: Input.GetUpdateVersion(),
            // file_key: null,
            // file_url: null,
        };

        if (this.FileKey || Input.IsUseExternURL()) {
            const url = Input.GetCustomExternURL();
            body.file_url = url ? url : this.GeneratorRepoURL();
        } else {
            body.file_key = this.FileKey;
        }

        // 发送请求
        const response = await axios.post(
            url,
            body,
            this.GeneratorRequestHeader(),
        );

        if (response.data.status !== 2000) {
            core.setFailed(
                `更新资源失败，状态码: ${response.data.status} => ${
                    this.UpdateStatusCodeMap[response.data.status]
                }`,
            );
            return;
        }
        core.info(`请求更新资源成功`);
    }

    CheckInput() {
        const Token = Input.GetToken();
        if (Token == "" || Token == null) {
            core.setFailed("请提供 MineBBS 开发者 Token!");
            return false;
        }
        const ResourceID = Input.GetResourceID();
        if (ResourceID == "" || ResourceID == null) {
            core.setFailed("请提供资源 ID!");
            return false;
        }
        return true;
    }

    async Run() {
        if (!this.CheckInput()) return;

        if (!Input.IsUseExternURL()) {
            if (!fs.existsSync(path.resolve(Input.GetUploadFile()))) {
                // 检查文件是否存在
                core.setFailed("文件不存在, 请检查 upload_file!");
                return;
            }

            await this.RequestUploadFile().catch((e) => {
                core.setFailed(`Fail in RequestUploadFile, exception: ${e}`);
            }); // 开始上传
        }

        await this.RequestUpdateResource().catch((e) => {
            core.setFailed(`Fail in RequestUpdateResource, exception: ${e}`);
        });

        core.info(`文件上传成功`);
    }

    constructor() {}
}

new UploadMineBBS().Run();
