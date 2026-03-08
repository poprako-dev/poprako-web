# Agent 助手开发铁则（严禁漏看、违反）

必须每次回答用户之前，至少调用一次 `get_errors` 来检查是否有错误，并且必须在回答中包含 `get_errors` 的结果。

我的项目主颜色全部放在 index.css 中，必须按照我的规范进行复用。

所有的可复用组件都在 components/ 下，必须每次开发前检查是否有可复用组件可以使用，严禁重复造轮子。

子组件拒绝无脑卡片式，会严重降低软件质感。

组件必须使用 export default function，而不是 React.FC。

可以使用 function 的时候，严禁使用闭包。

使用 Tailwind、Lucide-react、clsx 等工具库时，必须按照我的规范进行使用，严禁随意使用。

样式必须写在 return 块内，不得污染外部的逻辑部分。
