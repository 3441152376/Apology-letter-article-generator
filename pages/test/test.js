// pages/test/test.js
import Wxml2Canvas from 'wxml2canvas';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgs: [],
    },
    drawImage() {
        const that = this;
        var wxcanvas = new Wxml2Canvas({
            width: 600,
            height: 856,
            element: 'canvas1',
            background: '#fff',
            destZoom: 6,
            progress(percent) {},
            finish(url) {
                wx.hideLoading();
                wx.saveImageToPhotosAlbum({
                    filePath: url,
                    //授权成功，保存图片
                    success: function() {
                        that.setData({
                            isShowCirclePicDia: false
                        })
                        wx.showToast({
                            title: '保存成功',
                            icon: 'success',
                            duration: 2000
                        })
                    }
                })
            },
            error(res) {}
        });

        let data = {
            list: [{
                type: 'wxml',
                class: '.share__canvas1 .draw_canvas', // draw_canvas指定待绘制的元素
                limit: '.share__canvas1', // 限定绘制元素的范围，取指定元素与它的相对位置
                x: 0,
                y: 0
            }]
        }
        wxcanvas.draw(data);
    },


    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

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