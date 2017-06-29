#coding: utf8
from flask import Flask
from flask import Response, request, abort
import urlparse
import requests
import json
import tushare as ts
from random import randint
from bs4 import BeautifulSoup
import pandas as pd
# import sys
# reload(sys)
# sys.setdefaultencoding('utf-8')

app = Flask(__name__)
# sinaApi = "http://hq.sinajs.cn/list="
detailUrl = "http://stockpage.10jqka.com.cn/%s/company/"
toutiao = "http://www.toutiao.com/api/article/recent/?source=2&category=%s&as=A105177907376A5&cp=5797C7865AD54E1&count=5&offset=0&_=%s"


def getUserAgent():
    userAgent = ["Mozilla/5.0 (compatible, MSIE 10.0, Windows NT, DigExt)",
        "Mozilla/4.0 (compatible, MSIE 7.0, Windows NT 5.1, 360SE)",
        "Mozilla/4.0 (compatible, MSIE 8.0, Windows NT 6.0, Trident/4.0)",
        "Mozilla/5.0 (compatible, MSIE 9.0, Windows NT 6.1, Trident/5.0,",
        "Opera/9.80 (Windows NT 6.1, U, en) Presto/2.8.131 Version/11.11",
        "Mozilla/4.0 (compatible, MSIE 7.0, Windows NT 5.1, TencentTraveler 4.0)",
        "Mozilla/5.0 (Windows, U, Windows NT 6.1, en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50",
        "Mozilla/5.0 (Macintosh, Intel Mac OS X 10_7_0) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11",
        "Mozilla/5.0 (Macintosh, U, Intel Mac OS X 10_6_8, en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50",
        "Mozilla/5.0 (Linux, U, Android 3.0, en-us, Xoom Build/HRI39) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13",
        "Mozilla/5.0 (iPad, U, CPU OS 4_3_3 like Mac OS X, en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5",
        "Mozilla/4.0 (compatible, MSIE 7.0, Windows NT 5.1, Trident/4.0, SE 2.X MetaSr 1.0, SE 2.X MetaSr 1.0, .NET CLR 2.0.50727, SE 2.X MetaSr 1.0)",
        "Mozilla/5.0 (iPhone, U, CPU iPhone OS 4_3_3 like Mac OS X, en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5",
        "MQQBrowser/26 Mozilla/5.0 (Linux, U, Android 2.3.7, zh-cn, MB200 Build/GRJ22, CyanogenMod-7) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"]

    return userAgent[randint(0,len(userAgent)-1)]

@app.route("/<app>/", methods=["GET","POST"])
def index(app):
    headers = {"User-Agent": getUserAgent()}
    code = request.args["code"]
    data = {}
    error = ""

    if app == "now":
        # 获取当前价格
        code = code.split(",")
        df = ts.get_realtime_quotes(code)
        ret = df.to_json()

    elif app == "stock":
        # 获取股票历史数据
        df = ts.get_hist_data(code)
        df = df.sort_index()
        df["date"] = df.index
        df.index = range(len(df.index))
        ret = df.to_json()

    elif app == "detail":
        # 获取股票基本数据
        # 公司名称
        # 所属地域
        # 公司简介
        # 经营范围
        ret = {}
        url = detailUrl % code
        page = requests.get(url, headers=headers)
        soup = BeautifulSoup(page.content, "html.parser")
        name = soup.select("td span")[0].text
        bussines = soup.select("td span")[3].text
        region = soup.select("td span")[1].text
        intro = soup.select("p.tip.lh24")[-2].text[:-3]
        
        ret["name"] = name
        ret["bussines"] = bussines
        ret["region"] = region
        ret["intro"] = intro

    elif app == "bt":

        ret = [{"status":"ok"}]

    elif app == "news":
        # 反向代理今日头条
        catelog = request.args["catelog"]
        time = request.args["now"]
        url = toutiao % (catelog, time)
        page = requests.get(url, headers=headers)

        ret = [{"status":"ok"}]

    else:
        ret = ""
        error = "incorrect url"

    try:
        data["data"] = json.loads(ret)
    except Exception as e:
        data["data"] = ret
    data["error"] = error
    # print data
    resp = Response(json.dumps(data))
    if error:
        abort(500)

    resp.headers["Content-Type"] = "application/json; charset=UTF-8"
    resp.headers["access-control-allow-origin"] = "*"
    
    return resp

if __name__ == "__main__":
    app.run(port=80,debug=True, host="0.0.0.0")
