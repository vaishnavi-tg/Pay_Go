import { Account } from "../models/accountModel.js"
import express from "express"
import { authMiddleware } from "../middleware.js";
import mongoose from "mongoose"

const balance =  async (req, res) => {
  const account = await Account.findOne({ userId: req.userId });
    console.log(account)
    res.json({
        balance: account.balance
    })
}

const transfer = async (req,res)=>{
  
  const session = await mongoose.startSession()

    session.startTransaction()
    const { amount, to } = req.body

    // Fetch the accounts within the transaction
    const account = await Account.findOne({ userId: req.userId }).session(session)

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Invalid account"
        });
    }

    // Perform the transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    // Commit the transaction
    await session.commitTransaction();

    res.json({
        message: "Transfer successful"
    });
}

export { balance ,transfer }