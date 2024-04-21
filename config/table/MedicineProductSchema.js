const express = require('express');

const csv = require('csv-parser');
const fs = require('fs');
const AWS= require('../awsConfig');

const Joi = require('joi');
const MedicineproductSchema = Joi.object({
    medicineName: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().required(),
    quantity: Joi.number().required()
});






const createTables=async(req,res) => {
    const dynamoDB = new AWS.DynamoDB();

   const  medicineTable={ 
    TableName: "MedicineTable",
    KeySchema: [
        { AttributeName: 'MedicineName', KeyType: 'HASH' }, // Partition key
         { AttributeName: 'Price', KeyType: 'RANGE' } // Sort key for price
    ],
    AttributeDefinitions: [
        { AttributeName: 'MedicineName', AttributeType: 'S' }, // String
        { AttributeName: 'Price', AttributeType: 'N' }, // Number
        { AttributeName: 'Quantity', AttributeType: 'N' }, // Number
        // { AttributeName: 'Description', AttributeType: 'S' } // String
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 25, // Adjust as needed
        WriteCapacityUnits: 25 // Adjust as needed
    },
    LocalSecondaryIndexes: [
        {
            IndexName: 'QuantityIndex',
            KeySchema: [
                { AttributeName: 'MedicineName', KeyType: 'HASH' }, // Same partition key as main table
                { AttributeName: 'Quantity', KeyType: 'RANGE' } // Sort key for quantity
            ],
            Projection: { ProjectionType: 'ALL' } // Include all attributes in projection
        }],
        

  };

  try {
 
    console.log(medicineTable);
   const data= await dynamoDB.createTable(medicineTable).promise();

    console.log('Table created successfully.', data);
    return res.send("ceatedSuccessFully").status(200);
  }
   catch (error) {
    console.error('Error creating table:', error);
    return res.send("not crested").status(400);
  }



}



const deleteParticularSortKeyInTable = async (req,res) => {
    const sortKeyTobeDeleted=req.params.sortKeyTobeDeleted;
    const params = {
        TableName: 'MedicineTable',
        Key: {
            'MedicineName':MedicineName,
            'Price': sortKeyTobeDeleted
        }
    };

    docClient.delete(params, (err, data) => {
        if (err) {
            console.error("Unable to delete sorted key in table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Sorted key deleted successfully deleted successfully:", JSON.stringify(data, null, 2));
        }
    });
};

//  const deleteTable=dynamodb.deleteTable(medicineTable, (err, data) => {
//     if (err) {
//         console.error('Unable to delete table. Error JSON:', JSON.stringify(err, null, 2));
//     } else {
//         console.log('Table deleted successfully.');
//     }
// });

//  crud operation in data 

const docClient = new AWS.DynamoDB.DocumentClient();



const addDataInTable=async(req,res)=>{


    try {
        console.log(req);
        
        const {error}=MedicineproductSchema.validate(req.body);
        
        if (error) {
            console.log("error" ,error);
            return res.status(400).send("enter the product details correectly");
        }

        var addnewProduct = {
            TableName: 'MedicineTable',
            Item: {
                'MedicineName': req.body.medicineName,
                'Price': req.body.price,
                'Description': req.body.description,
                'Quantity': req.body.quantity
            }
        };
       console.log(addnewProduct)
      await  docClient.put(addnewProduct, function(err, data) {
            if (err) {
                console.error(err);
            } else {
                console.log("PutItem succeeded:", data);
            }
         });
    
        res.status(200).send('Item added to ProductTable');
    } catch (err) {
        console.error('Unable to add item to DynamoDB:', err);
        res.status(500).send('Unable to add item to DynamoDB');
    }
};




const addBulkDataInTable=(async (req, res) => {
    try {
          // Access the uploaded CSV file
          const file = req.file;

          // Check if file exists
          if (!file) {
              return res.status(400).send('No file uploaded');
          }
  
          // Process the uploaded CSV file
          const results = [];
          fs.createReadStream(file.path)
              .pipe(csv())
              .on('data', (data) => results.push(data))
              .on('end', async () => {
                  // Process each row in the CSV file
                  for (const row of results) {
                    console.log("row value" ,row);
                      try {
                        
                          // Check if item exists in DynamoDB
                          const params = {
                            TableName: 'MedicineTable',
                            // Name of your LSI
                            // dynamic
                            KeyConditionExpression: 'MedicineName = :name',
                            ExpressionAttributeValues: {
                                ':name': row.MedicineName
                            }    
                          };
                          const data = await docClient.query(params).promise();
  
                          if (data && data.Item) {
                           
                              // If item exists, update it
                              const updateParams = {
                                  TableName: "MedicineTable",
                                  Key: {'MedicineName': row.MedicineName },
                                  UpdateExpression: 'SET Price = :price, Description = :description, Quantity = :quantity',
                                  ExpressionAttributeValues: {
                                      ':price': parseInt(row.Price,10),
                                      ':description': row.Description,
                                      ':quantity': parseInt(row.Quantity,10)
                                  },
                                  ReturnValues: 'ALL_NEW'
                              };
                              console.log("update entry",updateParams);
                              await docClient.update(updateParams).promise();
                              console.log(`Item updated: ${row.MedicineName}`);
                          } else {
                              // If item doesn't exist, create a new item
                            //   console.log("price",typeof(row.Price),"quantity",typeof(row.Quantity));
                              const createParams = {
                                  TableName: "MedicineTable",
                                   Item: {
                                    'MedicineName': row.MedicineName,
                                    'Price': parseInt(row.Price),
                                    'Description': row.Description,
                                    'Quantity': parseInt(row.Quantity)
                                }
                                
                              };
                              console.log("new entry",createParams);
                            //   console.log("price",typeof(parseInt(row.Price)),"quantity",typeof(parseInt(row.Quantity)));
                              await docClient.put(createParams).promise();
                              console.log(`Item created: ${row.MedicineName}`);
                          }
                      } catch (error) {
                          console.error('Error processing row:', error);
                      }
                  }
                  
                  res.status(200).send('CSV file uploaded and processed successfully');
              });
    } catch (error) {
        console.error('Error processing CSV file:', error);
        res.status(500).send('Error processing CSV file');
    }});




    const getAllDataFromTable = async (req, res) => {
    try {
       const tableDetails = {
            TableName: 'MedicineTable', 
        };

        const data = await docClient.scan(tableDetails).promise();
        console.log('Successfully retrieved all data:', JSON.stringify(data, null, 2));
        res.status(200).json(data.Items);
    } catch (error) {
        console.error('Unable to retrieve data from DynamoDB:', JSON.stringify(error, null, 2));
        res.status(500).send('Unable to retrieve data from DynamoDB');
    }

};


   const  getParticularDetails= async(req,res)=>{
    
  
    try{
       
        const medicineName = req.params.medicineName;
        // console.log("out of get medicineName",medicineName);
    
    const currentMedicine= {
        TableName: 'MedicineTable',
  
        KeyConditionExpression: 'MedicineName = :name',
        ExpressionAttributeValues: {
            ':name': medicineName
        }
    };
 
     const data = await docClient.query(currentMedicine).promise();
    // const data = await docClient.scan(currentMedicine).promise();
    console.log(data);
    if (data.Items.length === 0) {
        console.log("Medicine not found")
        res.status(404).send('Medicine not found');
    } else {
        console.log(data.Items);
        res.send(data.Items).status(200);
        

 }
}

 catch (error) {
    console.error('Unable to fetch item:', error);
   
    // res.status(500).send('Unable to fetch item');
    
    
}
}




 const updateMedicineData=async(req,res)=>{
    try {
        const medicineName = req.params.medicineName;
      
        const { price, description, quantity } = req.body;
        
        console.log("data ", medicineName,quantity,description);


        if (description){
            const updatedMedicineVal = {
                TableName: 'MedicineTable',
                Key:{'MedicineName': medicineName,
                         'Price':price
                    },
             
                UpdateExpression: 'SET  Description = :description',
                ExpressionAttributeValues: {
                   
                      ':description': description,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
    
            const data = await docClient.update(updatedMedicineVal).promise();
            if (data){
                console.log("description changed success Fully");
                res.send("description changed SuccessFully").status(200);
            }
            else{
                console.log(  "description not changed success Fully");
                res.send("description not changed SuccessFully").status(400);

            }
        }
        if (quantity){
            const updatedMedicineVal = {
                TableName: 'MedicineTable',
                Key:{'MedicineName': medicineName,
                         'Price':price
                    },
             
                UpdateExpression: 'SET  Quantity = :quantity',
                ExpressionAttributeValues: {
                   
                      ':quantity': quantity,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
    
            const data = await docClient.update(updatedMedicineVal).promise();
            if (data){
                console.log("quantity changed success Fully");
                res.send("quantity changed SuccessFully").status(200);
            }
            else{
                console.log(  "quantity not changed success Fully");
                res.send("quantity not changed SuccessFully").status(400);

            }

        }



    } catch (error) {
        console.error('Unable to update item:', error);
        res.status(500).send('Unable to update item');
    }
}


 const deleteParticularMedicine=async(req,res)=>{
 
    try{
        const medicineName=req.params.medicineName;
        const price=parseInt(req.params.price);
        console.log("delete", medicineName,price);
        const dataTobeRemove = {
            TableName: 'MedicineTable',
            Key: {
                'MedicineName': medicineName,
                'Price':price
            }
        };


       const deletedMedicineProduct=   await docClient.delete(dataTobeRemove).promise();
       
        console.log("Item deleted successfully",deletedMedicineProduct);
        res.status(200).send('Item deleted successfully');
    }
    catch(err){
        console.error('Unable to query items:', err);
        res.status(500).send('Unable to query items');

    }
}

 module.exports ={ createTables,addBulkDataInTable,

    deleteParticularMedicine,updateMedicineData,getParticularDetails, getAllDataFromTable,deleteParticularSortKeyInTable,addDataInTable,addDataInTable}

 










