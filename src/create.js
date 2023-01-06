/* eslint-disable no-undef */
/**
 * github API使用： https://blog.csdn.net/weixin_43829154/article/details/120697007
 * https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-tags
 * 
 * */

// const { downLoadTempDirectory } = require('./constants')
const downLoadTempDirectory = `${process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']}/.template`;
const axios = require('axios');
const ora = require('ora'); // 版本过高可能会报使用方式错误。降低本吧就好了，建议v3版本
const Inquirer = require('inquirer'); // 建议v8版本

// 引入下载代码仓库需要的依赖项（第（5）步的时候看，现在可以忽略）
let downloadGitRepo = require('download-git-repo');
const { promisfy } = require('promisfy');
downloadGitRepo = promisfy(downloadGitRepo);
let { ncp } = require('ncp');
ncp = promisfy(ncp);
const fs = require('fs');
const path = require('path');
const MetalSmith = require('metalsmith');  // 遍历文件夹，找需不需要渲染
// const ejs = require('ejs');  // 安装了就行，不需要引入

const { render } = require('consolidate').ejs; // 模板解析工具：统一了所有的模板引擎


// cons.requires.ejs = ejs.configure();


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
    // await downloadGitRepo(api, dist);
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
            message: 'place choise a tag to create project \n',
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
        // （5-1）简单的，直接拷贝到当前目录（需要安装ncp， 也是异步回调的形式，需要用promisfy修改）
        /*
            npm i ncp： https://www.npmjs.com/package/ncp
            做什么？ 把下载的模板内容拷贝到当前目录，同时目录的名称修改为我们创建项目的名称
        */
        // await ncp(dist, path.resolve(projectName)) // 直接拷贝过来就行

        // （5-2）复杂的，需要渲染后，再拷贝到当前目录
        /* 有些文件内容如下：
        package.json
        {
            name: <%=name%>,
            ...
            private:<%=private%>,
            author:<%=author%>
            ...
            description:<%=description%>
            ...
        }
        这些都是动态属性，ejs模板，需要询问用户，然后根据用户输入进行渲染完成后再拷贝到当前目录。
        既然我们需要询问用户，我们就要配置一个【询问文件，下面假设为ask.js】，然后通过一个库（metalsmith），来执行对用户的询问。
        
        metalsmith： https://www.npmjs.com/package/metalsmith
        github-example：https://github.com/metalsmith/metalsmith/tree/master/examples/build-tool
        
        如果存在ask.js文件，则需要使用复杂模板进行编译，否则直接拷贝
        */
        await new Promise((resolve, reject) => {
            // 因为这是个异步方法，我们需要让其尽量变成同步，所以我们需要在前面增加await，则需要外层包一下。
            if (fs.existsSync(path.join(dist, 'ask.js'))) {
                // (5-2-1): 根据文件让用户填写信息
                MetalSmith(__dirname)  // 传入路径，则默认只遍历当前路径下的src文件。这里我们肯定是不用这个的，但是不传还不行，
                    .source(dist) // 我们这里传了source后，则上面的路径配置失效，而是采用这个目录。且是所以文件。
                    .destination(path.resolve(projectName)) // 最后渲染完成后，会把文件吐到这里
                    .use(async (files, metal, done) => {
                        const askFile = require(path.join(dist, 'ask.js')); // 获取到询问文件
                        // 构建询问inquirer配置
                        const inputObj = await Inquirer.prompt(askFile);
                        console.log(inputObj);
                        const meatedata = metal.metadata();
                        Object.assign(meatedata, inputObj)
                        delete files['ask.js']; // 渲染构建后的模板不再需要该文件
                        done()
                    }) // 可以写多个use，但是每个use尽量只做一件事，以方便代码阅读
                    .use((files, metal, done) => {
                        const meatedata = metal.metadata();
                        console.log(meatedata);
                        // 获取每一个文件，然后校验是否是ejs文件。则执行处理操作，图片、txt文件啥的就不处理
                        Reflect.ownKeys(files).forEach(async (fileName) => {
                            if (fileName.includes('js') || fileName.includes('json')) {
                                let content = files[fileName].contents.toString();
                                if (content.includes('<%')) {
                                    console.log(fileName);
                                    content = await render(content, meatedata); // 得到的是字符串，需要转成buffer回填
                                    files[fileName].contents = Buffer.from(content);
                                    console.log(files[fileName]);
                                }
                            }

                        });
                        done()
                    })
                    .build((err) => {
                        if (err) { reject() }
                        else {
                            resolve()
                        }
                    })
                // (5-2-2): 回填信息到文件本身
            } else {
                ncp(dist, path.resolve(projectName))
            }
        })

    } else {
        // （5）下载项目模板（需要安装： download-git-repo，由于不是promise类型的，需要安装promisfy工具将其返回转为promise）
        console.log('项目下载中...');
        console.log(`${downLoadTempDirectory}/${selRepoName}`);
        const dist = await waiting(downLoadRepo, 'download Template ...')(selRepoName);
        console.log('无tag', dist);
        // （5-1）简单的，直接拷贝到当前目录
        // ncp(dist, path.resolve(projectName)) // 直接拷贝过来就行
        // （5-2）复杂的，需要渲染后，再拷贝到当前目录
        await new Promise((resolve, reject) => {
            // 因为这是个异步方法，我们需要让其尽量变成同步，所以我们需要在前面增加await，则需要外层包一下。
            if (fs.existsSync(path.join(dist, 'ask.js'))) {
                // (5-2-1): 根据文件让用户填写信息
                MetalSmith(__dirname)  // 传入路径，则默认只遍历传入路径下的src文件。这里我们肯定是不用这个的，但是不传还不行，
                    .source(dist) // 我们这里传了source后，则上面的路径配置失效，而是采用这个目录。且是所以文件。
                    .destination(path.resolve(projectName)) // 最后渲染完成后，会把文件吐到这里
                    .clean(true)  // 检验等下渲染完成后，要把文件吐出的地方是否已经存在了该目录，如果存在，则删除
                    .use(async (files, metal, done) => {
                        const askFile = require(path.join(dist, 'ask.js')); // 获取到询问文件
                        // 构建询问inquirer配置
                        const inputObj = await Inquirer.prompt(askFile);
                        // console.log(inputObj);
                        const meatedata = metal.metadata();
                        Object.assign(meatedata, inputObj)
                        delete files['ask.js']; // 渲染构建后的模板不再需要该文件
                        done()
                    }) // 可以写多个use，但是每个use尽量只做一件事，以方便代码阅读
                    .use((files, metal, done) => {
                        const meatedata = metal.metadata();
                        // 获取每一个文件，然后校验是否是ejs文件。则执行处理操作，图片、txt文件啥的就不处理
                        Reflect.ownKeys(files).forEach(async (filepath) => {
                            if (filepath.includes('js') || filepath.includes('json')) {
                                let content = files[filepath].contents.toString();
                                if (content.includes('<%') && !filepath.includes('assets')) {
                                    let newContent = await render(content, meatedata); // 得到的是字符串，需要转成buffer回填
                                    // console.log('完整路径名称：', path.join(dist, filepath)); // 路径没问题
                                    // console.log(newContent); // 返回的内容也没有问题
                                    // 方式一：
                                    // #region 重新构建该文件
                                    files[filepath].contents = Buffer.from(res)
                                    // #endregion

                                    // 方式二如下： 
                                    // #region 写成同步后，通过这种方式是可以的(①：以管理员方式是可以的。②：非管理员也可以)
                                    // await new Promise((fileResolve, fileReject) => {
                                    //     fs.writeFile(path.join(dist, filepath), Buffer.from(newContent, 'utf-8'), function (err) {
                                    //         if (err) fileReject(err);
                                    //         else fileResolve();
                                    //     });
                                    // });
                                    // #endregion
                                }
                            }

                        });
                        done()
                    })
                    .build((err) => {
                        if (err) { reject() }
                        else {
                            resolve()
                        }
                    })
                // (5-2-2): 回填信息到文件本身

            } else {
                ncp(dist, path.resolve(projectName))  // 拷贝速度很快，所以没有使用异步
            }
        })
    }

}