import Wxml2Canvas from '../../src/index';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        // paperWidth: '600px', // 稿纸实际宽度
        imgs: []
    },
    drawImage() {
        wx.showLoading({
            title: '加载中'
        })
        const that = this;
        let wxcanvas = new Wxml2Canvas({
            width: 2479,
            height: 3508,
            element: 'canvas1',
            background: '#fff',
            progress(percent) {
                console.log(percent)
            },
            finish(url) {
                console.log(url)
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
            error(res) {
                console.log(res)
            }
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
    onLoad(options) {},
    // 获取文章内容
    changeIndexInE: function() {
        let varpages = getCurrentPages();
        let varprevPage = varpages[varpages.length - 2];
        // console.log(varprevPage.data.article)
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        // this.changeIndexInE();
        // 获取稿纸实际宽度
        // let that = this;
        // var query = wx.createSelectorQuery();
        // query.select('.paper').boundingClientRect();
        // query.exec(function(res) {
        //     console.log(res)
        //     that.setData({
        //         paperWidth: (res[0].width) + 'px'
        //     })
        // });

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // this.drawImage1()
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