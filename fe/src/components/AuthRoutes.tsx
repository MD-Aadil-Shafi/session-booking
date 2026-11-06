import {lazy, Suspense} from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SidebarContainer } from './Sidebar'
const Dashboard = lazy(()=>import("../pages/Dashboard"))
const Loading = lazy(()=>import("../components/Loading"))
const Professionals = lazy(()=>import("../pages/Professionals"))
const Sessions = lazy(()=>import("../pages/Sessions"))
const Notifications = lazy(()=>import("../pages/Notifications"))
const ProfessionalProfile = lazy(()=>import("../pages/ProfessionalProfile"))
// const Profile = lazy(()=>import("../pages/Profile"))
import { useAppSelector } from '../redux/useTypedSelectors'

const AuthRoutes = () => {
  const {user} = useAppSelector(state => state.auth);
  if(!user?.email){
    return <Navigate to="/login"/>
  }
  console.log('user', user)
  return (
    <SidebarContainer>
    <Suspense fallback={<Loading/>}>
    <Routes>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/professionals' element={<Professionals/>}/>
        <Route path='/professional/:id' element={<ProfessionalProfile/>}/>
        <Route path='/sessions' element={<Sessions/>}/>
        <Route path='/notifications' element={<Notifications/>}/>
        {/* <Route path='/documents' element={<Documents/>}/>
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/chat/:id' element={<Chat/>}/> */}
    </Routes>
    </Suspense>
    </SidebarContainer>
  )
}

export default AuthRoutes