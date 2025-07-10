import React,{useState} from 'react';
import { useNavigate,Link } from 'react-router-dom';

const Signup = () => {
    const navigate=useNavigate();
    const [form,setForm] = useState({name:"",email:"",password:"",confirmpassword:""});

    const handleChange=(e) => {
        setForm({...form,[e.target.name]:e.target.value});
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        if (form.password !==form.confirmpassword) return alert ('Passwords do not match');

        const res=await fetch('/api/auth/register',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(form)
        });
        if(res.ok){
            alert("Signup Successful");
            navigate('/');
          }else{
            alert("Signup failed");
          }
          
    }
  return (
    <div className='flex items-center justify-center min-h-screen bg-black'>
        <div className='bg-white backdrop-blur-sm p-10 rounded shadow-2xl w-full max-w-md'>
            <h1 className='text-4xl font-extrabold mb-6 text-center text-gray-900'>Register Account</h1>
            <form action="" className='space-y-6' onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="" className='block text-sm font-semibold text-gray-700'>Name</label>
                    <input onChange={handleChange} type="text" name="name"  className='mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'/>
                </div>
                <div>
                    <label htmlFor="" className='block text-sm font-semibold text-gray-700'>Email</label>
                    <input type="email" onChange={handleChange} name="email"  className='mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'/>
                </div>
                <div>
                    <label htmlFor="" className='block text-sm font-semibold text-gray-700'>Password</label>
                    <input type="password" onChange={handleChange} name="password" className='mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'/>
                </div>
                <div>
                    <label htmlFor="" className='block text-sm font-semibold text-gray-700'>Confirm Password</label>
                    <input type="password" onChange={handleChange} name='confirmpassword'  className='mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'/>
                </div>
                <button type='submit' className='w-full bg-pink-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition duration-300'>Register</button>
            </form>
            <p className='text-sm text-center text-gray-700 mt-6'>Already have an account?<Link to="/" className='text-purple-700 font-medium underline hover:text-purple-900'> Log In</Link></p>
        </div>
    </div>
  )
}

export default Signup