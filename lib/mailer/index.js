
/**
 * Sends Emails to users on events. Needs configuration to be correctly used
 */

/**
 * Module dependencies
 */

import nodemailer from 'nodemailer';
import config from 'config';
import remark from 'remark';
import html from 'remark-html';
import bus from 'lib/bus';

const {mailer} = config;
const toHtml = (md) => String(remark().use(html).process(md));

const transport = mailer.mailgun
  ? nodemailer.createTransport(require('nodemailer-mailgun-transport')(mailer.mailgun))
  : nodemailer.createTransport("SMTP", mailer.smtp);

const errorHandler = (err, info) => {
  if(err) return console.log('EMAIL SEND ERR', err);
  console.log('Message sent: ' + info.response);
}

const sendJoinMail = ({from, to, project}) => transport.sendMail({
  from: from.email,
  to: to.email,
  subject: `[${config.title}] ${from.email} joined your project!`,
  html: `<h1>HackDash</h1><p>Hi there! ${from.name} Joined your project <strong>${data.project.title}</strong>.</p>` // TODO change this)
});

function sendProposalMail({to, project}, callback=errorHandler) {
  transport.sendMail({
    from: mailer.from,
    to: to.email,
    replyTo: mailer.reply_to,
    subject: `[${config.title}] 感謝您的提案: ${project.title}`,
    html: toHtml([
      '## 恭喜您剛剛完成提案！',
      `${to.name} 您好！`, '',
      '以下是貼心小提醒，希望能幫助您的提案變得更好、更完整：', '',
      '1. 再次閱讀您的提案，特別是第一段的專案介紹，能夠讓不同領域的人都理解本專案在做什麼嗎？',
      '2. 經費需求是否有明確列出？是否確實了解由獎助金支持的工作內容需以開源的形式公開釋出？',
      '3. 請記得點選右上大頭貼，加上[個人簡介](https://grants.g0v.tw/users/profile)，讓評選團隊能更認識您。',
      '4. 分享您的提案，邀請其他人來提供修改提案的意見。也歡迎您加入其他提案討論，激盪出更棒的想法。',
      `5. 歡迎隨時補充您的提案和友善回應[線上討論](${config.discourseUrl})`,
      `6. 建議您訂閱[獎助金一般討論](https://discuss.grants.g0v.tw/c/grants-general)，以及有關自己提案主題的所有回覆（點選圓圈下拉選單，選擇「關注」）。`, '',
      '### 請記得提案內容僅可在 2017/2/13 23:59(UTC+8) 之前編修，請在此之前完成所有內容補充',
      '', `${config.title} 團隊敬上`].join("\n"))
  }, callback)
}

export default function handleMail(data) {
	switch(data.type) {
	  case "project_created":
      if (data.project.domain === config.grantdash.dashboard) {
	      sendProposalMail({to: data.user, project: data.project});
      }
    break;
  }
}

bus.on('post', handleMail);
