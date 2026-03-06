import logging
import os
import sys
from logging.handlers import TimedRotatingFileHandler

import PyPtt
from apscheduler.schedulers.blocking import BlockingScheduler

LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "ptt_autologin.log")
LOG_FORMAT = "[%(asctime)s][%(levelname)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logger() -> logging.Logger:
    os.makedirs(LOG_DIR, exist_ok=True)

    logger = logging.getLogger("ptt_autologin")
    logger.setLevel(logging.INFO)

    file_handler = TimedRotatingFileHandler(
        LOG_FILE,
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8",
    )
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))

    logger.addHandler(file_handler)
    logger.addHandler(stdout_handler)
    return logger


logger = setup_logger()


def login_ptt(username: str, password: str) -> None:
    logger.info("開始登入 PTT，帳號：%s", username)
    ptt = None
    try:
        ptt = PyPtt.API()
        ptt.login(username, password)
        logger.info("登入成功，帳號：%s", username)
    except PyPtt.exceptions.LoginError as e:
        logger.error("登入失敗，帳號：%s，原因：%s", username, e)
    except PyPtt.exceptions.WrongIDorPassword:
        logger.error("登入失敗，帳號：%s，原因：帳號或密碼錯誤", username)
    except PyPtt.exceptions.LoginTooOften:
        logger.warning("登入過於頻繁，帳號：%s，請稍後再試", username)
    except Exception as e:
        logger.error("登入時發生未預期錯誤，帳號：%s，原因：%s", username, type(e).__name__)
    finally:
        if ptt is not None:
            try:
                if ptt.is_login:
                    ptt.logout()
                    logger.info("已登出，帳號：%s", username)
            except Exception as e:
                logger.warning("登出時發生錯誤，帳號：%s，原因：%s", username, type(e).__name__)


def main() -> None:
    username = os.environ.get("PTT_USERNAME", "").strip()
    password = os.environ.get("PTT_PASSWORD", "").strip()

    if not username or not password:
        logger.error("環境變數 PTT_USERNAME 或 PTT_PASSWORD 未設定，程式終止")
        sys.exit(1)

    logger.info("PTT 自動登入服務啟動，帳號：%s，排程時間：每日 11:00 (Asia/Taipei)", username)

    scheduler = BlockingScheduler(timezone="Asia/Taipei")
    scheduler.add_job(
        login_ptt,
        trigger="cron",
        hour=11,
        minute=0,
        args=[username, password],
        id="ptt_daily_login",
        name="PTT 每日自動登入",
        misfire_grace_time=300,
    )

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("服務已停止")


if __name__ == "__main__":
    main()
