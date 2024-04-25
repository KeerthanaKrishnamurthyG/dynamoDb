/*
 * Trinom Digital Pvt Ltd ("COMPANY") CONFIDENTIAL                             *
 * Copyright (c) 2024 Trinom Digital Pvt Ltd, All rights reserved              *
 *                                                                             *
 * NOTICE:  All information contained herein is, and remains the property      *
 * of COMPANY. The intellectual and technical concepts contained herein are    *
 * proprietary to COMPANY and may be covered by Indian and Foreign Patents,    *
 * patents in process, and are protected by trade secret or copyright law.     *
 * Dissemination of this information or reproduction of this material is       *
 * strictly forbidden unless prior written permission is obtained from         *
 * COMPANY. Access to the source code contained herein is hereby forbidden     *
 * to anyone except current COMPANY employees, managers or contractors who     *
 * have executed Confidentiality and Non-disclosure agreements explicitly      *
 * covering such access.                                                       *
 *                                                                             *
 * The copyright notice above does not evidence any actual or intended         *
 * publication or disclosure of this source code, which includes               *
 * information that is confidential and/or proprietary, and is a trade secret, *
 * of COMPANY. ANY REPRODUCTION, MODIFICATION, DISTRIBUTION, PUBLIC            *
 * PERFORMANCE, OR PUBLIC DISPLAY OF OR THROUGH USE OF THIS SOURCE CODE        *
 * WITHOUT THE EXPRESS WRITTEN CONSENT OF COMPANY IS STRICTLY PROHIBITED,      *
 * AND IN VIOLATION OF APPLICABLE LAWS AND INTERNATIONAL TREATIES. THE         *
 * RECEIPT OR POSSESSION OF THIS SOURCE CODE AND/OR RELATED INFORMATION DOES   *
 * NOT CONVEY OR IMPLY ANY RIGHTS TO REPRODUCE, DISCLOSE OR DISTRIBUTE ITS     *
 * CONTENTS, OR TO MANUFACTURE, USE, OR SELL ANYTHING THAT IT MAY DESCRIBE,    *
 * IN WHOLE OR IN PART.                                                        *
 *                                                                             *
 * File: \routers\Inventory.js                                                 *
 * Project: medicinedata                                                       *
 * Created Date: Saturday, April 20th 2024, 10:29:55 am                        *
 * Author: Keerthana K <keerthana@codestax.ai>                                 *
 * -----                                                                       *
 * Last Modified: April 25th 2024, 6:47:23 am                                  *
 * Modified By: Keerthana K                                                    *
 * -----                                                                       *
 * Any app that can be written in JavaScript,                                  *
 *     will eventually be written in JavaScript !!                             *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date         By  Comments                                                   *
 * --------------------------------------------------------------------------- *
 */



const MedicineProductSchema=require('../config/table/MedicineProductSchema');
const multer = require('multer');
const csv = require('csv-parser');
 const express=require('express');
const router=express.Router();
const upload = multer({ dest: 'uploads/' });


const userTableSchema=require('../config/table/UserSchema');
const userOrderSchema=require('../config/table/userOrderTable')



const readtable=require('../config/table/readProductStockTable');
//  routing 
//   router.post('/medicineProduct/createTable',MedicineProductSchema.createTables);
router.post('/medicineProduct',MedicineProductSchema.addDataInTable);
router.post('/medicineProduct/BulkData',upload.single('csv'), MedicineProductSchema.addBulkDataInTable);
router.get('/medicineProduct/:medicineId',MedicineProductSchema.getParticularDetails);
router.get('/medicineProduct',MedicineProductSchema.getAllDataFromTable);
router.delete('/medicineProduct/:medicineId',MedicineProductSchema.deleteParticularMedicine);
// router.delete('/medicineProduct/deleteSortKey/:medicineName/:price',(MedicineProductSchema.deleteParticularMedicine));
router.put('/medicineProduct/:medicineId',MedicineProductSchema.updateMedicineData);


// user()
//  router.post('/user/createTable',userTableSchema.createTable);
 router.post('/user',userTableSchema.addUserData);
router.get('/user',userTableSchema.getAllUserDataFromTable);
router.get('/user/:userNumber',userTableSchema.getParticularUserDetails);
router.put('/user/:userNumber',userTableSchema.updateUserData);
router.delete('/user/:userNumber',userTableSchema.deleteUserFromTable)




// user order 
// router.post('/userOrderTable',userOrderSchema.createTable)
router.post('/userOrder',userOrderSchema.addNewUserOrder);
router.delete('/userOrder/:userPhoneNumber',userOrderSchema.deleteUserFromTable);
router.get('/userOrder/orderPlaced/:userPhoneNumber',userOrderSchema.getParticularUserOrderDetails);
router.get('/userOrder/:userPhoneNumber',userOrderSchema.getParticularUserDetails);
router.get('/userOrder/lasttransaction/:userPhoneNumber', userOrderSchema.getLasttransactionHistory);
module.exports = router;



// read order data
// router.post('/userOrder/read' ,readtable.createTables);