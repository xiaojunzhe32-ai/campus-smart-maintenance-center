import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Space, Dropdown, message } from "antd";
import {
  UserOutlined,
  EditOutlined,
  AppstoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import MyRepairs from "./MyRepairs";
import CreateRepairPage from "./CreateRepairPage";
import PersonalInfoEd from "../Services/PersonalInfoEd";
import { repairService } from "../Services/repairService";

const { Sider, Content, Header } = Layout;

const Home = () => {
  const [currentMenu, setCurrentMenu] = useState("my-repairs");
  const [collapsed, setCollapsed] = useState(false);
  const [repairOrders, setRepairOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 新增状态：控制个人信息编辑弹窗显示
  const [personalInfoModalVisible, setPersonalInfoModalVisible] = useState(false);

  // 新增状态：当前用户信息
  const [currentUser, setCurrentUser] = useState({
    username: "stu",
    email: "stu@student.edu.cn",
    phone: "",
    department: "计算机学院",
    position: "学生",
    studentID: "001",
  });

  // 侧边栏菜单配置
  const sideMenuItems = [
    {
      key: "my-repairs",
      icon: <AppstoreOutlined />,
      label: "我的报修",
    },
    {
      key: "create-repair",
      icon: <PlusOutlined />,
      label: "申请报修",
    },
  ];

  // 获取我的报修记录
  const fetchMyRepairs = async () => {
    setLoading(true);
    try {
      const result = await repairService.getRepairOrders();
      // 根据当前用户ID过滤数据
      const myOrders = result.data.filter(order => order.studentID === currentUser.studentID);
      setRepairOrders(myOrders);
    } catch (error) {
      console.error("获取报修记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRepairs();
  }, [refreshTrigger]);

  // 处理侧边栏菜单点击
  const handleSideMenuClick = (e) => {
    setCurrentMenu(e.key);
  };

  // 处理头像下拉菜单点击
  const handleAvatarMenuClick = (e) => {
    if (e.key === "edit-profile") {
      setPersonalInfoModalVisible(true);
    } else if (e.key === "logout") {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 跳转到登录页面
      window.location.href = '/login';
    }
  };

  // 处理个人信息更新
  const handleUserInfoUpdate = (updatedInfo) => {
    setCurrentUser(updatedInfo);
    message.success("个人信息更新成功！");
  };

  // 刷新数据
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 头像下拉菜单项
  const avatarMenuItems = [
    {
      key: "edit-profile",
      icon: <EditOutlined />,
      label: "编辑个人信息",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <UserOutlined />,
      label: "退出登录",
      danger: true,
    },
  ];

  return (
    <Layout style={{ height: "100vh" }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          position: "fixed",
          zIndex: 1,
          height: "100vh",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: "32px",
            margin: "16px",
            background: "rgba(255, 255, 255, 0.3)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          {collapsed ? "学生" : "学生报修系统"}
        </div>

        <Menu
          theme="dark"
          selectedKeys={[currentMenu]}
          mode="inline"
          items={sideMenuItems}
          onClick={handleSideMenuClick}
        />
      </Sider>

      <Layout>
        {/* 顶部Header */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "fixed",
            left: collapsed ? 80 : 200,
            zIndex: 1,
            right: 0,
            top: 0,
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            智能报修平台
          </div>

          <Space size="middle">
            <span>欢迎，{currentUser.username}</span>
            <Dropdown
              menu={{
                items: avatarMenuItems,
                onClick: handleAvatarMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <Avatar
                size="default"
                icon={<UserOutlined />}
                style={{
                  cursor: "pointer",
                  backgroundColor: "#1890ff",
                }}
              />
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            minHeight: 280,
            right: 0,
            left: collapsed ? 80 : 200,
            top: 64,
            position: "absolute",
          }}
        >
          {currentMenu === "my-repairs" && (
            <MyRepairs 
              repairOrders={repairOrders} 
              loading={loading}
              currentUser={currentUser}
              onRefresh={handleRefresh}
            />
          )}

          {currentMenu === "create-repair" && (
            <CreateRepairPage 
              currentUser={currentUser}
              onSubmitSuccess={() => {
                setCurrentMenu("my-repairs");
                handleRefresh();
              }}
            />
          )}
        </Content>
      </Layout>

      {/* 个人信息编辑弹窗 */}
      <PersonalInfoEd
        visible={personalInfoModalVisible}
        onCancel={() => setPersonalInfoModalVisible(false)}
        userInfo={currentUser}
        onUpdate={handleUserInfoUpdate}
      />
    </Layout>
  );
};

export default Home;