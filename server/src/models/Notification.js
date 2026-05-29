import mongoose from 'mongoose'

const notificationSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true,'接收者的ID是必填的']
    },
    type:{
        type:String,
        enum:['like','comment','follow','order','system','adoption'],
        required:[true,'通知类型是必填项']
    },
    title:{
        type:String,
        required:[true,'通知标题是必填项'],
        trim:true,
        maxlength:[200,'通知标题不能超过200个字符']
    },
    content:{
        type:String,
        required:[true,'通知内容是必填项'],
        trim:true,
        maxlength:[500,'通知内容不能超过500个字符']
    },
    relatedType:{
        type:String,
        enum:['post','order','user','adoption','comment','pet']
    },
    relatedId:{
        type:mongoose.Schema.Types.ObjectId,
    },
    extraData:{
        type:mongoose.Schema.Types.Mixed,
        default:{}
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    senderName:{
        type:String,
        trim:true,
        maxlength:[50,'发送者名称不能超过50个字符']
    },
    senderAvatar:{
        type:String,
        default:'',
    },
    isRead:{
        type:Boolean,
        default:false
    },
    readAt:{
        type:Date
    }
},{
    timestamps:true
})

notificationSchema.index({userId:1,isRead:1,createdAt:-1})

const Notification=mongoose.model('Notification',notificationSchema)

export default Notification