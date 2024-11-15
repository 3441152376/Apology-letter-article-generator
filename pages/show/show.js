// pages/show/show.js
const Bmob = require('../../utils//Bmob-2.3.1.min.js');
const dayjs = require('dayjs');
let rewardedVideoAd = null;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        topic: '',
        article: '',
        templateData: '', // 目标数据缓存
        worldNumber: 0, // 目标字数
        actualNumber: 0, // 实际生成字数
        show: false, // 是否显示弹窗
        statusBarHeight: '', // 状态栏高度
        isEdit: false, // 是否处于编辑状态
        chatgpt: false, //是否从ai页面跳转
    },
    edit() {
        if (!this.data.isEdit) wx.showToast({ title: '已进入编辑状态！', icon: 'none' })
        this.setData({
            isEdit: !this.data.isEdit
        })

    },
    // 复制
    copy() {
        wx.setClipboardData({
            data: this.data.article.replaceAll('&emsp;', ''),
            success(res) {
                console.log("成功")
            }
        })
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },

    // 重新生成文章
    refresh() {
        wx.showLoading({
            title: '生成中...',
        })

        var count = wx.getStorageSync('count') || 0;
        // 非vip的激励广告展示
        if (!this.isVip()) {
            if (count >= 3) {
                // 关闭提示
                wx.hideLoading()
                return wx.showModal({
                    title: '获取免费文章生成次数',
                    content: '您的文章生成次数已用完，非会员用户需观看一次激励广告免费获得三次文章生成机会。',
                    confirmText: '观看广告',
                    cancelText: '充值会员',
                    success(res) {
                        if (res.confirm) {
                            rewardedVideoAd.show()
                                .then(() => console.log('激励视频 广告显示'));
                        } else if (res.cancel) {
                            wx.navigateTo({ url: '../recharge/recharge' })
                        }
                    }
                })
            }
        }

        wx.setStorageSync('count', ++count)
        let templateData = this.data.templateData;
        // 调用文章生成算法生成文章
        let result = this.createArticle(templateData);
        // 更新数据
        this.setData(result);
        // 关闭提示
        wx.hideLoading()
    },
    // 判断用户类型
    isVip() {
        let user = JSON.parse(wx.getStorageSync('bmob'));
        if (user.senior) {
            return true;
        }
        if (user.expire) {
            let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            return user.expire.iso > nowtime ? true : false
        }
        return false;
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {


        // 获取状态栏高度
        let res = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: res.statusBarHeight + 'px'
        });
        console.log(options)

        // 从chatai跳转过来
        if (options.chatgpt) {
            return this.setData({
                article: decodeURIComponent(options.content),
                chatgpt: true,
                topic: '智能AI生成'
            })
        }

        let that = this;
        wx.showLoading({
            title: '生成中...',
            mask: true
        })

        // 加载激励广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-e0279b5646da2956' })
            rewardedVideoAd.onLoad(() => {
                console.log('onLoad event emit')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((res) => {
                console.log('onClose event emit', res)
                if (res && res.isEnded) {
                    wx.setStorageSync('count', 0)
                    wx.showToast({ title: '广告观看有效！', icon: 'success' })
                } else {
                    wx.showToast({ title: '广告被提前关闭', icon: 'error' })
                }
            })
        }

        this.setData({
            topic: options.topic,
            worldNumber: options.worldNumber
        })
        let tempId = options.templateId;
        // 默认模板
        if (tempId == 'default' || tempId == 'default2') {
            // 读取默认模板
            this.defaultTemplate(tempId)
            return 0;
        }

        const query = Bmob.Query('Template');
        query.get(tempId).then(res => {
            let templateUrl = res.file.url;
            // 加载模板数据
            wx.request({
                url: templateUrl,
                success(res) {
                    let templateData = res.data;
                    that.data.templateData = templateData;
                    // 调用文章生成算法生成文章
                    let result = that.createArticle(templateData);
                    // 更新数据
                    that.setData(result);
                    // 关闭提示
                    wx.hideLoading()
                }
            })
        }).catch(err => {
            console.log(err)
        })
    },

    // 文章生成算法
    createArticle(templateData) {
        console.log(templateData);
        // 错误处理
        if (typeof(templateData) == 'string') {

            var json = templateData;
            json = json.replace(/\n/g, "").replace(/\r/g, ""); //去掉字符串中的换行符
            json = json.replace(/\n/g, "").replace(/\s|\xA0/g, ""); //去掉字符串中的所有空格
            try {
                var templateData = JSON.parse(json);
            } catch (e) {
                let lastIndex = templateData.lastIndexOf(',')
                if (lastIndex != -1) {
                    let begin = templateData.substring(0, lastIndex);
                    let end = templateData.substring(lastIndex + 1);
                    var templateData = JSON.parse(begin + end);
                }
            }

            // let res = templateData.replace(/(.*), /,'$1false');
            // var templateData = JSON.parse();
        }
        if (!templateData.footers) { templateData.footers = ['']; }
        if (!templateData.headers) { templateData.headers = ['']; }


        // 设置标题
        wx.setNavigationBarTitle({ title: templateData.name })

        console.log(templateData)

        // 关键词
        let topic = this.data.topic;
        // 目标字数
        let worldNumber = this.data.worldNumber;
        // 初始化字数
        var number = 0;

        // 头部生成
        let headerDataArr = templateData.headers;
        let headerIndex = this.getRandomIntInclusive(0, headerDataArr.length - 1)
        var header = headerDataArr[headerIndex];
        // 计算新生成的字数
        var number = header.replaceAll(' ', '').length;

        // 结尾生成
        let footerDataArr = templateData.footers;
        let footerIndex = this.getRandomIntInclusive(0, footerDataArr.length - 1)
        var footer = footerDataArr[footerIndex];
        // 计算新生成的字数
        var number = footer.replaceAll(' ', '').length + number;
        // console.log(footer)

        // 中部生成
        let middleDataArr = templateData.middles;
        var middle = '';

        while (true) {
            let middleIndex = this.getRandomIntInclusive(0, middleDataArr.length - 1)
            let middleItem = middleDataArr[middleIndex]
                // 计算字数
            var number = number + middleItem.replaceAll(' ', '').replaceAll('\n&emsp;&emsp;', '').length;
            console.log(number)
                // 继续生成
            var middle = middle + '\n&emsp;&emsp;' + middleItem;
            if (number + 50 > worldNumber) {
                // 结束中部生成
                break;
            }

        }
        // console.log(middle)

        // 合并
        var article = header + middle + '\n&emsp;&emsp;' + footer;

        // 替换x
        var article = article.replaceAll('x', topic)
            // 替换名称
        let localUser = wx.getStorageSync('userInfo');
        if (localUser) {
            var article = article.replaceAll('X', localUser.name)
        }

        console.log(article)
        console.log(number)

        return {
            article,
            actualNumber: number
        }
    },
    // 加载默认模板
    defaultTemplate(tempId) {
        let that = this;
        if (tempId == 'default') {
            var url = 'https://bf.egg404.cn/2022/07/30/d7da958240141a528070a0a3295fbb41.alr';
        } else {
            var url = 'https://bf.egg404.cn/2022/08/04/e4ae4a00408f1b7480738c72ecac272e.alr'
        }
        // 加载模板数据
        wx.request({
            url,
            success(res) {
                let templateData = res.data;
                that.data.templateData = templateData;
                // 调用文章生成算法生成文章
                let result = that.createArticle(templateData);
                // 更新数据
                that.setData(result);
                // 关闭提示
                wx.hideLoading()
            }
        })
    },
    // 生成随机整数数
    getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min; //含最大值，含最小值 
    },
    // 显示动作面板
    showActionSheet() {
        this.setData({
            show: !this.show
        })
    },
    // 跳转到手写体生成页面
    toHandwriting() {
        // wx.showToast({
        //         title: '模拟手写功能正在加紧开发中...',
        //         icon: 'none'
        //     })

        wx.navigateTo({
            url: "../hw/hw"
        })
    },
    onClose() {
        this.setData({ show: false });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})