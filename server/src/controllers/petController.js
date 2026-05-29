import Pet from '../models/Pet.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';

// 上传宠物头像
export const uploadPetAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, '请选择要上传的图片', 400, 'NO_FILE_UPLOADED');
    }

    const avatarUrl = `/uploads/pets/${req.file.filename}`;
    console.log('📸 [uploadPetAvatar] 新文件名:', req.file.filename);
    console.log('📸 [uploadPetAvatar] 新头像URL:', avatarUrl);
    console.log('📸 [uploadPetAvatar] 宠物ID:', req.params.id);

    const oldPet = await Pet.findById(req.params.id);
    console.log('📸 [uploadPetAvatar] 更新前头像:', oldPet?.avatar);

    if (!oldPet) {
      return errorResponse(res, '宠物不存在', 404, 'PET_NOT_FOUND');
    }

    if (oldPet.ownerId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '您没有权限操作此宠物档案', 403, 'FORBIDDEN');
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );
    console.log('📸 [uploadPetAvatar] 更新后头像:', updatedPet?.avatar);

    return successResponse(res, { pet: updatedPet }, '宠物头像上传成功');
  } catch (error) {
    console.error('📸 [uploadPetAvatar] 错误:', error);
    return errorResponse(res, error.message, 500, 'UPLOAD_PET_AVATAR_FAILED');
  }
};

// 上传宠物照片（多张）
export const uploadPetPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, '请选择要上传的图片', 400, 'NO_FILE_UPLOADED');
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return errorResponse(res, '宠物不存在', 404, 'PET_NOT_FOUND');
    }

    if (pet.ownerId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '您没有权限操作此宠物档案', 403, 'FORBIDDEN');
    }

    // 添加新照片到现有照片数组
    const newPhotos = req.files.map(file => `/uploads/pets/${file.filename}`);
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $push: { photos: { $each: newPhotos } } },
      { new: true, runValidators: true }
    );

    return successResponse(res, { photos: newPhotos, updatedPet }, '照片上传成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPLOAD_PET_PHOTOS_FAILED');
  }
};

// 删除宠物照片
export const deletePetPhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return errorResponse(res, '照片URL不能为空', 400, 'MISSING_PHOTO_URL');
    }

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return errorResponse(res, '宠物不存在', 404, 'PET_NOT_FOUND');
    }

    if (pet.ownerId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '您没有权限操作此宠物档案', 403, 'FORBIDDEN');
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $pull: { photos: photoUrl } },
      { new: true }
    );

    return successResponse(res, { pet: updatedPet }, '照片删除成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'DELETE_PET_PHOTO_FAILED');
  }
};

//创建宠物档案
export const createPet=async(req,res)=>{
    try{
        const petData={
            ...req.body,
            ownerId:req.userId
        }

        const pet=new Pet(petData)
        await pet.save()

        return  successResponse(res, { pet }, '宠物档案创建成功', 201); 

    } catch(error){
        return errorResponse(res, error.message, 500, 'CREATE_PET_FAILED');
    }
}

// 获取当前用户的宠物列表
export const getMyPets = async (req, res) => {
  try {
    const { species } = req.query;
    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = { ownerId: req.userId };
    if (species) {
      query.species = species;
    }

    const pets = await Pet.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await Pet.countDocuments(query);

    return successResponse(res, buildPaginationResponse(pets, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_PETS_FAILED');
  }
};

//获取宠物详情
export const getPetProfile=async(req,res)=>{
    try{
        const pet=await Pet.findById(req.params.id)
        if(!pet){
            return errorResponse(res,'宠物宝宝不存在',404,'PET_NOT_FOUND')
        }

        //权限检查，自己只能查看自己的宠物
        if(pet.ownerId.toString()!==req.userId.toString() && req.role!=='admin'){
            return errorResponse(res,'您没有权限查看此宠物档案',403,'FORBIDDEN')
        }

        return successResponse(res,{pet},'宠物档案获取成功')
    } catch(error){
        return errorResponse(res,error.message,500,'GET_PET_FAILED')
    }
}

//更新宠物信息
export const updatePetProfile=async(req,res)=>{
    try{
        const isAdmin=req.role==='admin' 
        const filter={
            _id:req.params.id,
            ...(isAdmin ? {} : {ownerId:req.userId})
        }

        // 防止用户修改宠物主人
        delete req.body.ownerId

        const updatePet=await Pet.findOneAndUpdate(
            filter,
            req.body,
            { new: true, runValidators: true }
        )
        if(!updatePet){
            return errorResponse(res,'宠物宝宝不存在/您没有权限更新此宠物档案',404,'PET_NOT_FOUND')
        }
        return successResponse(res,{updatePet},'宠物档案更新成功')

    } catch(error){
        return errorResponse(res,error.message,500,'UPDATE_PET_FAILED')
    }
} 

//删除宠物信息
export const deletePetProfile=async(req,res)=>{
    try{
        const isAdmin=req.role==='admin' 
        const filter={
            _id:req.params.id,
            ...(isAdmin ? {} : {ownerId:req.userId})
        }

        const deletePet=await Pet.findOneAndDelete(filter)
        if(!deletePet){
            return errorResponse(res,'宠物宝宝不存在/您没有权限删除此宠物档案',404,'PET_NOT_FOUND')
        }
        return successResponse(res,null,'宠物档案删除成功')
    } catch(error){
        return errorResponse(res,error.message,500,'DELETE_PET_FAILED')
    }
}

//添加健康记录（疫苗/驱虫/病历）
export const addHealthRecord=async(req,res)=>{
    try{
        const {type,record}=req.body
        if(!type || !record){
            return errorResponse(res,'类型和记录内容不能为空',400,'MISSING_FIELDS')
        }
        const isAdmin=req.role==='admin' 
        const filter={
            _id:req.params.id,
            ...(isAdmin ? {} : {ownerId:req.userId})
        }
        let updateProfile={}
        if(type==='vaccine'){
            updateProfile.$push={'healthRecords.vaccines':record}
        }else if(type==='deworming'){
            updateProfile.$push={'healthRecords.dewormings':record}
        }else if(type==='medical'){
            updateProfile.$push={'healthRecords.medicalHistory':record}
        }else{
            return errorResponse(res,'无效的记录类型',400,'INVALID_TYPE')
        }

        const updatePet=await Pet.findOneAndUpdate(
            filter,
            updateProfile,
            { new: true, runValidators: true }
        )
        if(!updatePet){
            return errorResponse(res,'宠物宝宝不存在/您没有权限更新此宠物档案',404,'PET_NOT_FOUND')
        }
        return successResponse(res,{updatePet},'健康记录添加成功')
    } catch(error){
        return errorResponse(res,error.message,500,'ADD_HEALTH_RECORD_FAILED')
    }
}

// 删除健康记录（疫苗/驱虫/病历）
export const deleteHealthRecord = async (req, res) => {
  try {
    const { type, recordId } = req.params
    if (!type || !recordId) {
      return errorResponse(res, '类型和记录ID不能为空', 400, 'MISSING_FIELDS')
    }

    const isAdmin = req.role === 'admin'
    const filter = {
      _id: req.params.id,
      ...(isAdmin ? {} : { ownerId: req.userId })
    }

    let pullField = ''
    if (type === 'vaccine') {
      pullField = 'healthRecords.vaccines'
    } else if (type === 'deworming') {
      pullField = 'healthRecords.dewormings'
    } else if (type === 'medical') {
      pullField = 'healthRecords.medicalHistory'
    } else {
      return errorResponse(res, '无效的记录类型', 400, 'INVALID_TYPE')
    }

    const updatedPet = await Pet.findOneAndUpdate(
      filter,
      { $pull: { [pullField]: { _id: recordId } } },
      { new: true }
    )

    if (!updatedPet) {
      return errorResponse(res, '宠物宝宝不存在/您没有权限更新此宠物档案', 404, 'PET_NOT_FOUND')
    }

    return successResponse(res, { pet: updatedPet }, '健康记录删除成功')
  } catch (error) {
    return errorResponse(res, error.message, 500, 'DELETE_HEALTH_RECORD_FAILED')
  }
}

// 获取健康提醒（即将到期的疫苗和驱虫）
export const getHealthReminders = async (req, res) => {
  try {
    const days = Math.max(parseInt(req.query.days) || 30, 1);
    const now = new Date();
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const pets = await Pet.find({ ownerId: req.userId });

    const reminders = [];
    for (const pet of pets) {
      if (pet.healthRecords && pet.healthRecords.vaccines) {
        for (const vaccine of pet.healthRecords.vaccines) {
          if (vaccine.nextDate && vaccine.nextDate <= targetDate && vaccine.nextDate >= now) {
            reminders.push({
              petId: pet._id,
              petName: pet.name,
              petAvatar: pet.avatar,
              type: 'vaccine',
              name: vaccine.name,
              date: vaccine.nextDate,
              record: vaccine
            });
          }
        }
      }
      if (pet.healthRecords && pet.healthRecords.dewormings) {
        for (const deworming of pet.healthRecords.dewormings) {
          if (deworming.nextDate && deworming.nextDate <= targetDate && deworming.nextDate >= now) {
            reminders.push({
              petId: pet._id,
              petName: pet.name,
              petAvatar: pet.avatar,
              type: 'deworming',
              name: deworming.type || '驱虫',
              date: deworming.nextDate,
              record: deworming
            });
          }
        }
      }
    }

    reminders.sort((a, b) => new Date(a.date) - new Date(b.date));

    return successResponse(res, { reminders, count: reminders.length }, '获取健康提醒成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_HEALTH_REMINDERS_FAILED');
  }
};