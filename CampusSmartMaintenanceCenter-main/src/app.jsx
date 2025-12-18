import React from 'react';
import {Routes, Route} from 'react-router-dom';

import StuHome from './Student/stuhome';
import WorkerHome from './Worker/workerhome';
import AdminHome from './Admin/adminhome';
import Login from './Login';
import RepairOrderList from './Admin/RepairOrderList';
import './App.css';
function App(){
    return (
        <div className="App" style={{fontSize:'larger'}}>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/stuhome" element={<StuHome />} />
                <Route path="/workerhome" element={<WorkerHome />} />
                <Route path="/adminhome" element={<AdminHome />} />
                <Route path="/repairOrders" element={<RepairOrderList repairOrders={undefined} loading={undefined} />} />
            </Routes>
        </div>
    );
};

export default App;