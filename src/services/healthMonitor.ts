import axios from "axios";
import cron from "node-cron";
import { sendMail } from "@/utils/mailer";

interface HealthMonitorOptions {
  url: string;
  interval?: string;         // cron 表达式，例如 "*/5 * * * *" 每5分钟
  failThreshold?: number;    // 连续失败次数阈值
  toEmail: string;           // 告警邮箱
  serviceName?: string;      // 服务名标识
}

export class HealthMonitor {
  private failCount = 0;
  private hasAlerted = false;

  constructor(private options: HealthMonitorOptions) {
    this.options.interval = options.interval || "*/5 * * * *";
    this.options.failThreshold = options.failThreshold || 3;
  }

  start() {
    console.log(`🩺 [Monitor] 启动健康监控：${this.options.url}`);
    cron.schedule(this.options.interval!, () => this.check());
  }

  private async check() {
    try {
      const res = await axios.get(this.options.url, { timeout: 5000 });
      if (res.status === 200 && res.data?.status === "ok") {
        if (this.failCount >= this.options.failThreshold! && this.hasAlerted) {
          // 故障恢复通知
          await sendMail({
            to: this.options.toEmail,
            subject: `✅ [恢复通知] ${this.options.serviceName || "AI 服务"} 已恢复`,
            text: `${new Date().toISOString()}\n接口已恢复正常。`,
          });
        }

        this.failCount = 0;
        this.hasAlerted = false;
        console.log(`[Monitor] ${new Date().toISOString()} 健康正常 ✅`);
      } else {
        throw new Error(`响应异常: ${res.status}`);
      }
    } catch (err: any) {
      this.failCount++;
      console.warn(`[Monitor] 检测失败 (${this.failCount}/${this.options.failThreshold})`, err.message);

      if (this.failCount >= this.options.failThreshold! && !this.hasAlerted) {
        this.hasAlerted = true;
        await sendMail({
          to: this.options.toEmail,
          subject: `🚨 [警告] ${this.options.serviceName || "AI 服务"} 连续失败`,
          text: `检测时间: ${new Date().toISOString()}\n错误信息: ${err.message}\n检测地址: ${this.options.url}`,
        });
      }
    }
  }
}
