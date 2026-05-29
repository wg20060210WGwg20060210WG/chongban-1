import Notification from '../models/Notification.js';
import {successResponse, errorResponse} from '../middleware/response.js';

const requireAuth = (req, res) => {
  if (!req.userId) {
    errorResponse(res, '未授权访问', 401, 'UNAUTHORIZED');
    return false;
  }
  return true;
};

export const getNotifications=async(req,res)=>{
  if (!requireAuth(req, res)) return;
  try{
        const {page=1,pageSize=20,isRead,type}=req.query

        //分页参数校验
        const safePage=Math.max(1,parseInt(page))
        const safePageSize=Math.min(50,Math.max(1,parseInt(pageSize)))
        
        //查询参数
        const query={userId:req.userId}
        if(isRead!==undefined){
          query.isRead=isRead==='true'
        }
        if(type){
          query.type=type
        }
        
        //查询通知
        const [notifications,total]=await Promise.all([
          Notification.find(query)
          .sort({createdAt:-1})
          .skip((safePage-1)*safePageSize)
          .limit(safePageSize)
          .lean(),
          Notification.countDocuments(query)
        ])

        //
        return successResponse(res,{
          list:notifications,
          pagination:{
            page:safePage,
            pageSize:safePageSize,
            total,
            totalPages:Math.ceil(total/safePageSize)
          }
        })
  } catch(error){
    return errorResponse(res,error.message,500,'GET_NOTIFICATIONS_FAILED')
  }
}

//标记通知为已读
export const markAsRead=async(req,res)=>{
  if (!requireAuth(req, res)) return;
  try{

    //查询并更新通知为已读
    const notification=await Notification.findOneAndUpdate(
      {_id:req.params.notificationId,userId:req.userId},
      {isRead:true,readAt:new Date()},
      {new:true}
    )
    if(!notification){
      return errorResponse(res,'通知不存在',404,'NOTIFICATION_NOT_FOUND')
    }

    return successResponse(res,{notification},'已标记为已读')
  } catch(error){
    if(error.name==='CastError'){
      return errorResponse(res,'无效的通知ID',400,'INVALID_ID')
    }
    return errorResponse(res,error.message,500,'MARK_READ_FAILED')
  }
}

//标记所有通知为已读
export const markAllAsRead=async(req,res)=>{
  if (!requireAuth(req, res)) return;
  try{
    const result=await Notification.updateMany(
      {userId: req.userId,isRead:false},
      {isRead:true,readAt:new Date()}
    )
     return successResponse(res,{updatedCount:result.modifiedCount},'已全部标记为已读')
  } catch(error){
    return errorResponse(res,error.message,500,'MARK_ALL_READ_FAILED')
  }
}

//获取未读通知数量
export const getUnreadCount=async(req,res)=>{
  if (!requireAuth(req, res)) return;
  try{
    const count=await Notification.countDocuments({
      userId:req.userId,
      isRead:false
    })
    return successResponse(res,{count})
  } catch(error){
    return errorResponse(res,error.message,500,'GET_UNREAD_COUNT_FAILED')
  }
}
