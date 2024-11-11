<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>JyuZung的打工日志</title>
<link rel="stylesheet" type="text/css" href="style.css">
<link rel="stylesheet" type="text/css" href="nav.css">
<link rel="stylesheet" type="text/css" href="footer.css">

<script>
function listDisplay(str) { 
  document.getElementById("test").innerHTML = str; 
  document.getElementById(str).style.display = "block"; 
} 
function listHidde(str) { 
  document.getElementById(str).style.display = "none"; 
} 
</script>

</head>
<body>

<div class="header">
  <p>JyuZung的打工日志</p> 
</div> 
 
<div class="topnav">
  <div class="dropdown" style="background:LimeGreen" onmouseover="listDisplay(lastElementChild.id)" onmouseout="listHidde(lastElementChild.id)">
    <button class="dropbtn" style="font-size:large">入职</button>
    <div class="dropdown-content" id="jianliDropdown">
      <a href="./content_1.html">Employment</a> 
    </div>
  </div> 
  
  <div class="dropdown" onmouseover="listDisplay(lastElementChild.id)" onmouseout="listHidde(lastElementChild.id)">
    <button class="dropbtn">团建活动</button>
    <div class="dropdown-content" id="tuanjianDropdown">
      <a href="./content_2.html">PIC collect</a>
      <a href="#">More ...</a>
      <a href="#">More ...</a>
    </div>
  </div> 
 
  <div class="dropdown" onmouseover="listDisplay(lastElementChild.id)" onmouseout="listHidde(lastElementChild.id)">
    <button class="dropbtn">工作日志</button>
    <div class="dropdown-content" id="gongzuoDropdown">
      <a href="./content_3.html"> Team Party</a> 
    </div>
  </div> 

  <div class="dropdown" onmouseover="listDisplay(lastElementChild.id)" onmouseout="listHidde(lastElementChild.id)">
    <button class="dropbtn">木林森支撑</button>
    <div class="dropdown-content" id="mlsDropdown">
      <a href="./content_4.html">work in MLS</a> 
    </div>
  </div> 


  <a href="#" style="float:right"><img src="./pic/user.png" alt="user" style="width: 20px; height: 20px; vertical-align: middle; opacity: 0.2;">
    游客</a>
</div> 
 

<div class="row">
  <div class="leftcolumn" style="width:60%; padding:10px 40px 10px 10px; font-size: x-large;">
    <div class="card">
      <h2>HTML + CSS + JavaScript</h2>
      <ul>
        <li style="margin:0.5em 0;">登录页面: <a href="./login.html">login.html</a></li>
        <li style="margin:0.5em 0;">注册页面: <a href="./sign.html">sign.html</a></li>
        <li style="margin:0.5em 0;">js数据验证: <a href="./db.html?kd=root">db.html?kd=root</a></li>
        <li style="margin:0.5em 0;">从注册页面和登录页面提交表单后跳转到db.html页面进行身份验证,数据储存在cookie中,由于浏览器限制,目前只能在火狐等几个浏览器中使用cookie或者额外开通cookie</li>
        <li style="margin:0.5em 0;">页面之间可以来回跳转,根据屏幕宽度自动调整单列/多列现实</li>
      </ul>
    </div>
  </div>

  <div class="rightcolumn" style="width:40%">
    <div class="card">
      <h2>测试信息</h2>
      <div class="row" id="test" style="color:rgb(0, 0, 0); font-size: 30px; margin-top: 20px;">Testing...</div>
    </div>
    <div class="card">
      <h2>实现难点</h2>
      <textarea rows="6" style="width:90%; font-size: large;">
  1. 下拉菜单列表,使用了onmouseover和onmouseout事件,需要格外留意触发事件的元素,以绑定js函数
  2. 身份验证使用了cookie,页面跳转使用window.location.href
  3. 轮播,通过定时任务实现,在任务中改变元素的内容和属性
      </textarea>
    </div>
  </div>
</div>

<footer>
  <p>© 2024 JYUZUNG. </p>
  <ul class="footer-links">
      <li><a href="#">隐私政策</a></li>
      <li><a href="#">服务条款</a></li>
      <li><a href="#">联系我们</a></li>
  </ul>
</footer>
 
</body>
</html>