import {lazy, Suspense} from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';


// routes
const Loading = lazy(()=>import("./components/Loading"))
const Auth = lazy(()=> import("./pages/Auth"))
const AuthRoutes = lazy(()=> import("./components/AuthRoutes"))

const App = () => {
  
  return (
    <BrowserRouter>
    <Suspense fallback={<Loading/>}>
    <Routes>
      <Route index path='/' element={<Auth/>}/>
      <Route path='/login' element={<Auth/>}/>
      <Route path='/register' element={<Auth/>}/>
      <Route path='*' element={<AuthRoutes/>}/>
    </Routes>
    </Suspense>
    <ToastContainer />
    </BrowserRouter>
  )
}

export default App