

const MedicineProductSchema=require('../config/table/MedicineProductSchema');
const multer = require('multer');
const csv = require('csv-parser');
 const express=require('express');
const router=express.Router();
const upload = multer({ dest: 'uploads/' });


const userTableSchema=require('../config/table/UserSchema');
//  routing 
// router.post('/medicineProduct/',MedicineProductSchema.createTables);
router.post('/medicineProduct/addSingleData',MedicineProductSchema.addDataInTable);
router.post('/medicineProduct/BulkData',upload.single('csv'), MedicineProductSchema.addBulkDataInTable);
router.get('/medicineProduct/:medicineName',MedicineProductSchema.getParticularDetails);
router.get('/medicineProduct',MedicineProductSchema.getAllDataFromTable);
router.delete('/medicineProduct/:medicineName/:price',MedicineProductSchema.deleteParticularMedicine);
router.delete('/medicineProduct/deleteSortKey/:medicineName/:price',MedicineProductSchema.deleteParticularMedicine);
router.put('/medicineProduct/:medicineName',MedicineProductSchema.updateMedicineData);


// user
// router.post('/med/user/create',userTableSchema.createTable);
router.post('/user',userTableSchema.addUserData);
router.get('/user',userTableSchema.getAllUserDataFromTable);
router.get('/user/:userNumber',userTableSchema.getParticularUserDetails);
// router.put('/user/:userNumber',userTableSchema.);
router.delete('/user/:userNumber',userTableSchema.deleteUserFromTable)

module.exports = router;