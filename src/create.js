/**
 * github API使用： https://blog.csdn.net/weixin_43829154/article/details/120697007
 * https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-tags
 * 
 * */

const axios = require('axios');
const ora = require('ora'); // 版本过高可能会报使用方式错误。降低本吧就好了，建议v3版本
const Inquirer = require('inquirer'); // 建议v8版本
const { downLoadTempDirectory } = require('./constants')

// 引入下载代码仓库需要的依赖项（第（5）步的时候看，现在可以忽略）
let downloadGitRepo = require('download-git-repo');
const { promisfy } = require('promisfy');
downloadGitRepo = promisfy(downloadGitRepo);

// 获取项目模板列表
const fetchRepoList = async () => {
    const { data } = await axios.get('https://api.github.com/users/Userluckytian/repos')
    return data;
}

// 封装loading 需要传入方法以及显示的内容
const waiting = (asyncfn, showLabel) => async (...args) => {
    const spinner = ora(`${showLabel}\n`);
    spinner.start();
    // 放置获取失败！
    try {
        const data = await asyncfn(args);
        spinner.succeed();
        return data
    } catch (error) {
        throw new Error(error);
    } finally {
        spinner.stop();
    }
}

// 获取代码仓库的版本号
const fetchRepoTagList = async (selRepoName) => {
    const { data } = await axios.get(`https://api.github.com/repos/Userluckytian/${selRepoName}/tags`)
    return data;
}
//  下载代码仓库
const downLoadRepo = async (repoName, repoTag) => {
    let api = `Userluckytian/${repoName}`;
    if (repoTag) {
        api += `#${repoTag}`
    }
    const dist = `${downLoadTempDirectory}/${repoName}`;
    console.log(dist);
    await downloadGitRepo(api, dist);
    return dist; // 返回下载的最终目录
}

module.exports = async (projectName) => {
    // console.log('create 指令，要创建的项目名称为：', projectName);
    // (1) 拉取代码仓库列表(通过接口，请先安装axios)：
    // const repoList = await fetchRepoList();
    // const repoNameList = repoList.map(repoItem => repoItem.name);
    // console.log(repoNameList);
    /*(1-1)优化： 增加loading效果（需要安装：ora）
                    https://www.npmjs.com/package/ora
                    https://www.jianshu.com/p/52bed753d5be?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes
    */

    // const spinner = ora('fetching template ...\n');
    // spinner.start();
    // // 放置获取失败！
    // try {
    //     const repoList = await fetchRepoList();
    //     spinner.succeed();
    //     const repoNameList = repoList.map(repoItem => repoItem.name);
    //     console.log(repoNameList);
    // } catch (error) {
    //     throw new Error(error);
    // } finally {
    //     spinner.stop();
    // }

    /*(1-2)优化： 封装loading效果 */
    const repoList = await waiting(fetchRepoList, 'fetching template ...')();
    const repoNameList = repoList.map(repoItem => repoItem.name);
    // console.log(repoNameList);

    /* (2) 构建选择器（需要安装：inquirer）
        https://www.npmjs.com/package/inquirer
        http://t.zoukankan.com/mengfangui-p-12313440.html
     */
    const repoInquirerOptions = {
        name: 'selRepoName',
        type: 'list',
        message: 'place choise a template to create project \n',
        choices: repoNameList
    };
    const { selRepoName } = await Inquirer.prompt(repoInquirerOptions);
    // console.log(selRepoName);

    // (3) 获取版本号：
    const tagList = await waiting(fetchRepoTagList, 'fetching tags ...')(selRepoName);
    const repotagList = tagList.map(tagItem => tagItem.name);
    // console.log(repotagList);

    // (4) 构建版本选择器
    if (repotagList.length) {
        const tagInquirerOptions = {
            name: 'selTagName',
            type: 'list',
            message: 'place choise a template to create project \n',
            choices: repotagList
        };
        const { selTagName } = await Inquirer.prompt(tagInquirerOptions);
        console.log(selTagName);
        // （5）下载项目模板（需要安装： download-git-repo，由于不是promise类型的，需要安装promisfy工具将其返回转为promise）
        /*
            download-git-repo: https://www.npmjs.com/package/download-git-repo
            promisfy: https://www.npmjs.com/package/promisfy
           使用：
            let downloadGitRepo = require(download-git-repo);
           const {promisfy} = require('promisfy');
           downloadGitRepo = promisfy(downloadGitRepo);
        */
        console.log('项目下载中...');
        console.log(`${downLoadTempDirectory}/${selRepoName}`);
        const dist = await waiting(downLoadRepo, 'download Template ...')(selRepoName, selTagName);
        console.log('有tag', dist);
        // （5-1）简单的，直接拷贝到当前目录
        // （5-2）复杂的，需要渲染和，再拷贝到当前目录
    } else {
        // （5）下载项目模板（需要安装： download-git-repo，由于不是promise类型的，需要安装promisfy工具将其返回转为promise）
        console.log('项目下载中...');
        console.log(`${downLoadTempDirectory}/${selRepoName}`);
        const dist = await waiting(downLoadRepo, 'download Template ...')(selRepoName);
        console.log('无tag', dist);
        // （5-1）简单的，直接拷贝到当前目录
        // （5-2）复杂的，需要渲染和，再拷贝到当前目录
    }

}