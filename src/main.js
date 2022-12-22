// node中通过`process.argv`获取控制台输入的参数
// console.log(process.argv);

const { Command } = require('commander'); // (normal include)

const program = new Command();

program
  .name('create')    // 每个文件都 有且只有一个 name 属性
  .version('0.0.1')  // 每个文件都 有且只有一个 version 属性
  .option('-a, --config <path>', '这个是描述信息1')   // 每个文件后可配置多个 option 属性
  .option('-b, --config <path>', '这个是描述信息2')  // 每个文件后可配置多个 option 属性
  .option('-c, --config <path>', '这个是描述信息3');  // 每个文件后可配置多个 option 属性


  program.parse(process.argv);  // 类似开了一个监听！
