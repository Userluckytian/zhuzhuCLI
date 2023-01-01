const axios = require('axios');
const ora = require('ora'); // 版本过高可能会报使用方式错误。降低本吧就好了，建议v3版本
const Inquirer = require('inquirer'); // 建议v8版本


// 获取项目模板列表
const fetchRepoList = async () => {
    const { data } = await axios.get('https://api.github.com/users/Userluckytian/repos')
    return data;
}
// 封装loading 需要传入方法以及显示的内容
const waiting = async (asyncfn, showLabel) => {
    const spinner = ora(`${showLabel}\n`);
    spinner.start();
    // 放置获取失败！
    try {
        const data = await asyncfn();
        spinner.succeed();
        return data
    } catch (error) {
        throw new Error(error);
    } finally {
        spinner.stop();
    }
}

// 获取代码仓库的版本号 

module.exports = async (projectName) => {
    console.log('create 指令，要创建的项目名称为：', projectName);
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
    const repoList = await waiting(fetchRepoList, 'fetching template ...')
    const repoNameList = repoList.map(repoItem => repoItem.name);
    // console.log(repoNameList);

    /* (2) 构建选择器（需要安装：inquirer）
        https://www.npmjs.com/package/inquirer
        http://t.zoukankan.com/mengfangui-p-12313440.html
     */
    const InquirerOptions = {
        name: 'selRepoName',
        type: 'list',
        message: 'place choise a template to create project \n',
        choices: repoNameList
    };
    const { selRepoName } = await Inquirer.prompt(InquirerOptions);
    console.log(selRepoName);
}