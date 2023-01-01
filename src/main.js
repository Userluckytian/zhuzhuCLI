/* eslint-disable no-undef */

// （1）引入部分需要的文件
const path = require('path');

const { version } = require('./constants'); // 存放常量

// (2)(用于构建指令的： https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md#%e5%ae%89%e8%a3%85)
const { Command } = require('commander');

const program = new Command(); // 实例化指定

// 2-1开始构建部分指令：

// 2-1-1）版本号：
program.version(version);

// 2-1-2 定义一个crete命令：
program
  .command('create') // 构建一个create命令
  .alias('-c')  // 给这个命令增加别名
  .description('创建项目')   // 这个命令的功能描述
  .action(() => {   // 执行这个命令后要执行的动作(执行的内容请先看2-2后再看！)
    // console.log(123124);
    const filePath = path.resolve(__dirname, 'create');
    const args = process.argv;
    const needArgs = args.slice(3);
    require(filePath)(...needArgs);
  })


//  2-2 命令优化：

// 2-2-1：优化什么？ 答： 由于我们的命令后续会越来越多，2-1-2的内容会越写越多。但大部分是重复的内容，所以我们可以构建一个命令数组，去不断的扩展，因为基本结构是一致的，示例如下：
const commondConfigs = {
  // create 命令
  // create: {
  //   alias: 'c',  // create命令的别名
  //   description: '创建项目',  // create命令的别名
  //   examples: [  // 举例
  //     'zhuzhu create <project-name>'
  //   ]
  // },
  // 构建一个config命令
  config: {
    alias: 'conf',  // create命令的别名
    description: '修改或者获取cli的部分配置属性',  // create命令的别名
    examples: [  // 举例
      'zhuzhu config set <k> <v>',
      'zhuzhu config get <k>'
    ]
  },
  // 构建一个no found commond命令
  '*': {
    alias: '',  // create命令的别名
    description: 'commond not found',  // create命令的别名
    examples: [] // 举例
  }
}

//  2-2-2 开始构建：

// ① 获取指令名称
const commondNameArray = Reflect.ownKeys(commondConfigs);
// ② 开始便利
commondNameArray.forEach((command) => {
  const tempAlias = commondConfigs[command].alias;
  const tempDesc = commondConfigs[command].description;
  program
    .command(command) // 构建一个create命令
    .alias(tempAlias)  // 给这个命令增加别名
    .description(tempDesc)   // 这个命令的功能描述
    .action(() => {  // 执行这个命令后要执行的动作
      if (command === '*') {
        console.log(tempDesc);
      } else {
        // fix: 由于这里写起来会比较麻烦，比如使用switch..case、 if...elseif...else等
        // fix: 所以最好的办法： 每一个命令都写在一个文件中，文件名就叫指令名称，示例如下：
        const filePath = path.resolve(__dirname, command); // __dirname表示当前目录，我们的指令一般就放在当前目录中，所以完整路径就是再加个指令名称。
        // 我们的每个指令实际就是一个函数。该函数接受参数哦。
        // 我们的参数在进程：process.argv中。但是该进程返回的参数 我们并不是都要。
        const args = process.argv;
        // 所以做个截断。只取后半部分。
        /* 
          比如： zhuzhu create project1 
            process.argv  得到的参数为：
            [
              'E:\\Program Files\\nodejs\\node.exe',  // 执行命令的文件
              'E:\\Program Files\\nodejs\\node_modules\\zhuzhucli\\bin\\www',  // 执行的目录
              'create',  // 指令名称
              'project1' // 用户输入的参数（这个才是我们需要的）
            ] 
        */
        const needArgs = args.slice(3);
        require(filePath)(...needArgs);
      }
    })
});

//  2-3 优化help事件:  增加example
// 监听--help事件
program.on('--help', () => {
  console.log('\nExamples:');
  commondNameArray.forEach((command) => {
    const examples = commondConfigs[command].examples;
    examples.forEach(example => {
      console.log('  ' + example);
    });
  });
})

// (3) 指令构建完毕后，开始监听用户输入以执行相关指令的逻辑
// tip：关于用户输入的参数如何获取？ 答：存放在当前进程中。通过：process.argv获取！
// console.log(process.argv);
program.parse(process.argv);  // 类似开了一个监听, parse就是解析的意思，这句话就相当于执行： 对用户输入的参数进行解析！
