// pages/myBuy/myBuy.js
const Bmob = require('../../utils/Bmob-2.3.1.min');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        myTemplate: [],
        statusBarHeight: '', // 状态栏高度
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },

    // 获取我的购买
    getMyBuy() {
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId;
        const query = Bmob.Query("OrderForm");
        query.equalTo("template", "!=", "0");
        query.equalTo("userid", "==", userid);
        query.find().then(res => {
            console.log(res)
            this.setData({
                myTemplate: res
            })
        });
    },
    // 导入弹窗提示
    importShow(e) {
        // 导入到首页模板
        let item = e.currentTarget.dataset.template;
        console.log(item)
        let that = this;
        let content = `您正在导入此模板：${item.name}\n\n是否继续导入？`
        wx.showModal({
            title: '模板导入提示',
            content,
            confirmText: "是",
            cancelText: '否',
            success(res) {
                if (res.confirm) {
                    // 调用导入函数
                    that.importTemplate(item)

                }
            }
        })
    },
    // 导入模板
    importTemplate(item) {

        // 是否已经导入检测
        if (this.isAlreadyImport(item)) {
            return wx.showToast({ title: '此模板已导入过', icon: 'error' });
        }
        let myTemplate = wx.getStorageSync('myTemplate');
        if (myTemplate) {
            myTemplate.unshift({ name: item.name, objectId: item.template })
            wx.setStorageSync('myTemplate', myTemplate)
            wx.showToast({ title: '模板导入成功！', icon: 'success' })
        } else {
            wx.setStorageSync('myTemplate', [{ name: item.name, objectId: item.template }])
            wx.showToast({ title: '模板导入成功！', icon: 'success' })
        }
    },
    // 判断是否已经导入
    isAlreadyImport(item) {
        let myTemplate = wx.getStorageSync('myTemplate');
        if (!myTemplate) {
            return false;
        }
        let isEexist = myTemplate.some(existItem => {
            return existItem.objectId == item.template;
        })
        if (isEexist) {
            return true
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
        this.getMyBuy()

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