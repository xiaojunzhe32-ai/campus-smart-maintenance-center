
import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Space, Dropdown, message } from "antd";
import {
  UserOutlined,
  UserSwitchOutlined,
  FileTextOutlined,
  StarOutlined,
  BarChartOutlined,
  EditOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import RepairOrderList from "./RepairOrderList";
import UserManagement from "./UserManagement";
import DataAnalysis from "./DataAnalysis";
import FeedbackManagement from "./FeedbackManagement";
import PersonalInfoEd from "../Services/PersonalInfoEd"; // 导入个人信息编辑组件
import { repairService } from "../Services/repairService";

const { Sider, Content, Header } = Layout;

const AdminHome = () => {
  const [currentMenu, setCurrentMenu] = useState("data-analysis");
  const [repairOrders, setRepairOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // 新增状态：控制个人信息编辑弹窗显示
  const [personalInfoModalVisible, setPersonalInfoModalVisible] =
    useState(false);

  // 新增状态：当前管理员信息
  const [currentAdmin, setCurrentAdmin] = useState({
    username: "admin",
    email: "admin@manage.edu.cn",
    phone: "",
    department: "系统管理部",
    position: "系统管理员",
  });

  // 侧边栏菜单配置
  const sideMenuItems = [
    {
      key: "data-analysis",
      icon: <BarChartOutlined />,
      label: "数据统计与分析",
    },
    {
      key: "user-management",
      icon: <UserSwitchOutlined />,
      label: "用户管理",
    },
    {
      key: "order-management",
      icon: <FileTextOutlined />,
      label: "工单管理",
    },
    {
      key: "feedback-management",
      icon: <StarOutlined />,
      label: "评价管理",
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
      console.log("点击了编辑个人信息");
      // 打开个人信息编辑弹窗
      setPersonalInfoModalVisible(true);
    } else if (e.key === "logout") {
      // 处理退出登录
      console.log("退出登录");
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 跳转到登录页面
      window.location.href = '/login';
    }
  };

  // 处理个人信息更新
  const handleAdminInfoUpdate = (updatedInfo) => {
    setCurrentAdmin(updatedInfo);
    message.success("个人信息更新成功！");
    // 在实际项目中，这里可以调用API将更新后的信息保存到后端
    console.log("更新后的管理员信息:", updatedInfo);
  };

  // 获取工单数据
  const fetchRepairOrders = async () => {
    setLoading(true);
    try {
      const result = await repairService.getRepairOrders();
      setRepairOrders(result.data);
    } catch (error) {
      console.error("获取工单数据失败:", error);
      message.error("获取工单数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentMenu === "order-management") {
      fetchRepairOrders();
    }
  }, [currentMenu]);

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
          {collapsed ? "管理" : "报修管理系统"}
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
            管理员工作台
          </div>

          <Space size="middle">
            <span>欢迎，{currentAdmin.username}</span>
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
                  backgroundColor: "#fa541c",
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
          {currentMenu === "user-management" && <UserManagement />}

          {currentMenu === "order-management" && (
            <RepairOrderList repairOrders={repairOrders} loading={loading} />
          )}

          {currentMenu === "feedback-management" && <FeedbackManagement />}

          {currentMenu === "data-analysis" && <DataAnalysis />}
        </Content>
      </Layout>

      {/* 个人信息编辑弹窗 */}
      <PersonalInfoEd
        visible={personalInfoModalVisible}
        onCancel={() => setPersonalInfoModalVisible(false)}
        userInfo={currentAdmin}
        onUpdate={handleAdminInfoUpdate}
      />
    </Layout>
  );
};

export default AdminHome;
