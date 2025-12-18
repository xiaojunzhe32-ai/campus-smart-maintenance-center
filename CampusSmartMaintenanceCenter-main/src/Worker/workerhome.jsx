
import React, { useState } from "react";
import { Layout, Menu, Avatar, Space, Card } from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  EditOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import MyTask from "./myTask.jsx"; // 导入我的任务组件
import Dropdown from "antd/es/dropdown/dropdown.js";
import PersonalInfoEd from "../Services/PersonalInfoEd.jsx";

const { Sider, Content, Header } = Layout;

const WorkerHome = () => {
  const [currentMenu, setCurrentMenu] = useState("my-tasks");
  const [collapsed, setCollapsed] = useState(false);
  // 新增状态：控制个人信息编辑弹窗显示
  const [personalInfoModalVisible, setPersonalInfoModalVisible] =
    useState(false);
  // 新增状态：当前维修工信息
  const [currentWorker, setCurrentWorker] = useState({
    username: "worker",
    email: "worker@repair.com",
    phone: "",
    department: "维修部",
    position: "维修工",
  });

  // 侧边栏菜单配置 - 只有"我的任务"一项
  const sideMenuItems = [
    {
      key: "my-tasks",
      icon: <AppstoreOutlined />,
      label: "我的任务",
    },
  ];
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
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
    },
  ];

  // 处理菜单点击
  const handleMenuClick = (e) => {
    console.log("点击了菜单:", e.key);
    setCurrentMenu(e.key);
  };

  // 处理头像下拉菜单点击
  const handleAvatarMenuClick = (e) => {
    if (e.key === "edit-profile") {
      console.log("编辑个人信息");
      setPersonalInfoModalVisible(true);
    } else if (e.key === "logout") {
      console.log("退出登录");
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 跳转到登录页面
      window.location.href = '/login';
    }
  };

  //处理个人信息更新
  const handlePersonalInfoUpdate = (updatedInfo) => {
    setCurrentWorker(updatedInfo);
    console.log("更新后的个人信息:", updatedInfo);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
          {collapsed ? "维修" : "维修工系统"}
        </div>

        <Menu
          theme="dark"
          selectedKeys={[currentMenu]}
          mode="inline"
          items={sideMenuItems}
          onClick={handleMenuClick}
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
            维修工工作台
          </div>

          <Space size="middle">
            <span>欢迎，维修工</span>
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
                  backgroundColor: "#52c41a",
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
            bottom:0,
            position: "absolute",
          }}
        >
          {currentMenu === "my-tasks" && <MyTask />}
        </Content>
      </Layout>

      {/* 个人信息编辑弹窗 */}
      <PersonalInfoEd
        visible={personalInfoModalVisible}
        onCancel={() => setPersonalInfoModalVisible(false)}
        userInfo={currentWorker}
        onUpdate={handlePersonalInfoUpdate}
      />
    </Layout>
  );
};

export default WorkerHome;
