//加载Express模块
const express=require("express");
const cors=require("cors");
const mysql=require("mysql");
const bodyParser=require("body-parser");
const md5 = require('md5');
const pool=mysql.createPool({
   host:'127.0.0.1',
   port:3306,
   user:'root',
	password:'',
	database:'fanli'
});
//创建Express应用
const server=express();
// server.use(cors({
  // origin:['http://127.0.0.1:8080','http://localhost:8080']
//})); 
server.use(bodyParser.urlencoded({
    extended:false
}))
//用户注册API
server.post('/register',(req,res)=>{    
    //获取用户的注册信息
    var username = req.body.username;
    var password = md5(req.body.password);
	var email = req.body.email;
	var number =req.body.number;

    //查询是否存在输入的用户名,如果不存在,则将数据写入到数据表
    //如果存在,则返回错误信息给客户端
    var sql = "SELECT COUNT(id) AS count FROM fl_user WHERE username=?"; 
    pool.query(sql,[username],(err,results)=>{
        if(err) throw err;        
        //用户已经存在
        if(results[0].count == 1){
            res.send({message:'注册失败',code:201})
        }  else {
            //将获取到的用户信息写入到数据表
            sql = 'INSERT fl_user(username,password,email,number) VALUES(?,?,?,?)';
            pool.query(sql,[username,password,email,number],(err,results)=>{

                if(err) throw err;

                res.send({message:'注册成功',code:200});
            });
        }
    })

});
//用户登录API
server.post('/login',(req,res)=>{
    //获取用户登录的信息
     var username = req.body.username;
    var password = md5(req.body.password);
	console.log(username);
	console.log(password);
    //以用户名和密码为条件进行查找
    var sql = "SELECT id,username,password FROM fl_user WHERE username=? AND password=?";
    pool.query(sql,[username,password],(err,results)=>{
        if(err) throw err;
        if(results.length == 0){
            res.send({message:'登录失败',code:202});
        } else {
            res.send({message:'登录成功',code:200,info:results[0]});
        }
    });
});
//注销用户
server.get("/delete",(req,res)=>{
    var  id = req.query.id;
    var sql='delete from fl_user where lid=?';
    pool.query(sql,[id],(err,result)=>{
        if(err) throw err;
        if(result.affectedRows===0){
            res.send({code:401,msg:'delete error'})
        }else{
            res.send({code:200,msg:'delete suc'})
        }
    }) 
});
//获取导航
  server.get("/navbar",(req,res)=>{
      var sql='SELECT title,img,src FROM fl_navbar';
	  pool.query(sql,(err,results)=>{
		  if(err) throw err;
		  res.send({message:'查询成功',code:200,navs:results})
 	  })
  });
  //获取爆料导航
  server.get("/category",(req,res)=>{
    var sql='SELECT id,category_name FROM fl_category';
    pool.query(sql,(err,results)=>{
        if(err) throw err;
        res.send({message:'查询成功',code:200,category:results})
     })
});
//获取商品信息
   server.get("/details",(req,res)=>{
      var cid=req.query.cid;
      var page=req.query.page;
      var pagesize=5;
      var pagecount;
      var sql = 'SELECT COUNT(id) AS count FROM fl_product WHERE category_id=?';
      pool.query(sql,[cid],(err,results)=>{
        if(err) throw err;
     
        pagecount = Math.ceil(results[0].count / pagesize);
    });
    var offset = (page - 1) * pagesize;
       sql='SELECT id,pic,info,price,discount,image,source,informant,popularity,people  FROM fl_product WHERE category_id=? LIMIT ' + offset + ',' + pagesize;
   
        pool.query(sql,[cid],(err,results)=>{

        if(err) throw err;

        res.send({message:'查询成功',code:200,articles:results,pagecount:pagecount});
    });
});
//根据ID获取文章信息的API
server.get('/article',(req,res)=>{

    //获取URL地址栏的参数
    var id = req.query.id;

    //根据ID查询指定文章的SQL
    var sql = 'SELECT id,pic,info,price,discount,image,source,informant,popularity,people,count  FROM fl_product WHERE id=?';

    pool.query(sql,[id],(err,results)=>{

        if(err) throw err;
        //因为数据表中id是主键,也就意味着只存在唯一的一条记录
        res.send({message:'查询成功',code:200,article:results[0]});

    });
     
});
server.get('/product',(req,res)=>{
    var output={
        count:0,
        pageSize:9,
        pageCount:0,
        pno:req.query.pno||0,
        data:[]
      };
    //获取URL地址栏的参数
    var kw=req.query.kw||"";
    var kws=kw.split(" ");
    kws.forEach((elem,i,arr)=>{
        arr[i]=`pic like '%${elem}%'`;
      })
      var where=kws.join(" and ");
    //根据ID查询指定文章的SQL
    var sql = `SELECT id,pic,info,price,discount,image,source,informant,popularity,people,count  FROM fl_product WHERE   ${where}`;

    pool.query(sql,[where],(err,results)=>{
	    if (err) throw err;
	     output.data=results;
		  res.send(output);
	})
         
});
//根据ID获取文章信息的API
server.post('/car',(req,res)=>{

    //获取URL地址栏的参数
    var productId=req.body.id;
	var pic=req.body.pic;
	var image=req.body.image;
	var count=req.body.count;
	var discount=req.body.discount;
      console.log(productId)
    //根据ID查询指定文章的SQL
    var sql = 'SELECT  COUNT(productId) AS count  FROM fl_car WHERE productId=?';

    pool.query(sql,[productId],(err,results)=>{

        if(err) throw err;
        if(results[0].count == 1){
		     results[0].count++;
		}else{
		    sql = 'INSERT fl_car(productId,pic,image,count,discount) VALUES(?,?,?,?,?)';
             pool.query(sql,[productId,pic,image,count,discount],(err,results)=>{

                if(err) throw err;

                res.send({message:'插入成功',article:results});
            });
		}


    });
     
});
server.listen(3000);
