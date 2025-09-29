import React, { createContext, useContext, useReducer, useState, useEffect, useRef } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
  useNavigate,
  useParams,
  useLocation,
  Navigate,
  useRouteError,
} from 'react-router-dom';
import axios from 'axios';
import './app.css';

// --- AXIOS CONFIG ---
axios.defaults.baseURL = 'https://rdbackend-1.onrender.com';

// --- STATE MANAGEMENT (Context API) ---
const Store = createContext();

const initialState = {
  userInfo: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null,
  cart: {
    cartItems: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [],
    shippingAddress: localStorage.getItem('shippingAddress') ? JSON.parse(localStorage.getItem('shippingAddress')) : {},
    paymentMethod: localStorage.getItem('paymentMethod') || 'PayPal',
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'USER_LOGIN':
      return { ...state, userInfo: action.payload };
    case 'USER_LOGOUT':
      localStorage.clear();
      return {
        ...state,
        userInfo: null,
        cart: { cartItems: [], shippingAddress: {}, paymentMethod: '' },
      };
    case 'CART_ADD_ITEM': {
      const newItem = action.payload;
      const existItem = state.cart.cartItems.find((item) => item._id === newItem._id);
      const cartItems = existItem
        ? state.cart.cartItems.map((item) => (item._id === existItem._id ? newItem : item))
        : [...state.cart.cartItems, newItem];
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CART_REMOVE_ITEM': {
      const cartItems = state.cart.cartItems.filter((item) => item._id !== action.payload._id);
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CART_CLEAR':
        localStorage.removeItem('cartItems');
        return { ...state, cart: { ...state.cart, cartItems: [] } };
    case 'SAVE_SHIPPING_ADDRESS':
      localStorage.setItem('shippingAddress', JSON.stringify(action.payload));
      return { ...state, cart: { ...state.cart, shippingAddress: action.payload } };
    case 'SAVE_PAYMENT_METHOD':
      localStorage.setItem('paymentMethod', action.payload);
      return { ...state, cart: { ...state.cart, paymentMethod: action.payload } };
    default:
      return state;
  }
}

function StoreProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Store.Provider value={value}>{props.children}</Store.Provider>;
}

// --- PROTECTED ROUTES ---
const ProtectedRoute = ({ children }) => {
  const { state } = useContext(Store);
  const { userInfo } = state;
  return userInfo ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { state } = useContext(Store);
  const { userInfo } = state;
  return userInfo && userInfo.isAdmin ? children : <Navigate to="/login" />;
};

// --- ERROR BOUNDARY ---
const ErrorElement = () => {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
        <div className="bg-white p-10 rounded-lg shadow-2xl">
            <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h1 className="text-4xl font-bold text-gray-800">Oops! Something went wrong.</h1>
            <p className="text-gray-600 mt-2">We encountered an unexpected error. Please try refreshing the page.</p>
            <p className="text-sm text-gray-400 mt-6">{error.statusText || error.message}</p>
            <Link to="/" className="mt-6 inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
                Go back to Homepage
            </Link>
        </div>
    </div>
  );
};


// --- UI COMPONENTS ---
const Header = () => {
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo, cart } = state;
    const navigate = useNavigate();
  
    const logoutHandler = () => {
      ctxDispatch({ type: 'USER_LOGOUT' });
      navigate('/login');
    };
  
    return (
       <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold hover:text-gray-300 transition duration-300">
                <i className="fas fa-bolt mr-2"></i>DhootElectronics
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                <i className="fas fa-shopping-cart mr-1"></i> CART
                {cart.cartItems.length > 0 && (
                   <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {cart.cartItems.reduce((a, c) => a + c.qty, 0)}
                   </span>
                )}
              </Link>
              {userInfo ? (
                  <div className="relative group">
                      <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center transition">
                          <i className="fas fa-user mr-1"></i> {userInfo.name.split(' ')[0]} <i className="fas fa-caret-down ml-1"></i>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block animate-fade-in-down">
                          <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                          <Link to="/orderhistory" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Order History</Link>
                          <button onClick={logoutHandler} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                      </div>
                  </div>
              ) : (
                  <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"><i className="fas fa-user mr-1"></i> SIGN IN</Link>
              )}
              {userInfo && userInfo.isAdmin && (
                 <div className="relative group">
                      <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center transition"><i className="fas fa-user-shield mr-1"></i> ADMIN <i className="fas fa-caret-down ml-1"></i></button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block animate-fade-in-down">
                          <Link to="/admin/userlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Users</Link>
                          <Link to="/admin/productlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Products</Link>
                          <Link to="/admin/orderlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Orders</Link>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </nav>
      </header>
    );
};

const Footer = () => <footer className="bg-gray-800 text-white py-4 mt-auto"><div className="container mx-auto text-center"><p>Copyright &copy; DhootElectronics 2025</p></div></footer>;

const Loader = ({ type = 'spinner' }) => {
    if (type === 'skeleton') {
        return <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"><div className="w-full h-48 bg-gray-300"></div><div className="p-4"><div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div><div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div><div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div><div className="h-10 bg-gray-300 rounded"></div></div></div>
    }
    return <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
};

const Message = ({ variant = 'info', children }) => {
    const colorClasses = {
        info: 'bg-blue-100 border-blue-500 text-blue-700',
        success: 'bg-green-100 border-green-500 text-green-700',
        warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
        danger: 'bg-red-100 border-red-500 text-red-700',
    };
    return <div className={`border-l-4 p-4 rounded-r-lg ${colorClasses[variant]}`} role="alert"><p>{children}</p></div>;
};

const Product = ({ product }) => {
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart: { cartItems } } = state;

    const addToCartHandler = async () => {
        const existItem = cartItems.find((x) => x._id === product._id);
        const qty = existItem ? existItem.qty + 1 : 1;
        try {
            const { data } = await axios.get(`/api/products/${product._id}`);
            if (data.stock < qty) { 
                alert('Sorry. Product is out of stock');
                return;
            }
            ctxDispatch({ type: 'CART_ADD_ITEM', payload: { ...product, qty } });
        } catch (err) { console.error(err); }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col group">
            <Link to={`/product/${product._id}`} className="block overflow-hidden"><img className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" src={product.image} alt={product.name} /></Link>
            <div className="p-4 flex flex-col flex-grow">
                <Link to={`/product/${product._id}`}><h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 truncate">{product.name}</h3></Link>
                <div className="my-2"><Rating rating={product.rating} numReviews={product.numReviews} /></div>
                <h2 className="text-2xl font-bold text-gray-900">Rs {product.price}</h2>
                <div className="mt-auto pt-4">{product.stock === 0 ? <button className="w-full bg-gray-400 text-white py-2 rounded cursor-not-allowed" disabled>Out of Stock</button> : <button onClick={addToCartHandler} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-2 px-4 rounded transition">Add to cart</button>}</div>
            </div>
        </div>
    );
};

const Rating = ({ rating, numReviews }) => {
    return (
        <div className="flex items-center text-sm">
            {[1, 2, 3, 4, 5].map(star => (
                <i key={star} style={{ color: '#f8e825' }} className={rating >= star ? 'fas fa-star' : rating >= star - 0.5 ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
            ))}
            <span className="ml-2 text-gray-600">{numReviews} reviews</span>
        </div>
    )
};

const CheckoutSteps = ({ step1, step2, step3, step4 }) => <nav className="flex justify-center items-center space-x-2 sm:space-x-4 mb-8 text-xs sm:text-base"><div>{step1?<Link to="/login" className="text-blue-600 font-semibold">Sign In</Link>:<span className="text-gray-400">Sign In</span>}</div><span className="text-gray-400">&gt;</span><div>{step2?<Link to="/shipping" className="text-blue-600 font-semibold">Shipping</Link>:<span className="text-gray-400">Shipping</span>}</div><span className="text-gray-400">&gt;</span><div>{step3?<Link to="/payment" className="text-blue-600 font-semibold">Payment</Link>:<span className="text-gray-400">Payment</span>}</div><span className="text-gray-400">&gt;</span><div>{step4?<Link to="/placeorder" className="text-blue-600 font-semibold">Place Order</Link>:<span className="text-gray-400">Place Order</span>}</div></nav>;

// --- SCREENS ---
const HomeScreen = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get('/api/products');
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-800">Latest Products</h1>
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {[...Array(8).keys()].map(i => <Loader key={i} type="skeleton"/>)}
                    </div>
                ) : error ? <Message variant='danger'>{error}</Message> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {Array.isArray(products) && products.map(p => (<Product key={p._id} product={p} />))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductScreen = () => {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [qty, setQty] = useState(1);

    const { state, dispatch: ctxDispatch } = useContext(Store);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/products/${productId}`);
                setProduct(data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);
    
    const addToCartHandler = () => {
        ctxDispatch({ type: 'CART_ADD_ITEM', payload: { ...product, qty } });
        navigate('/cart');
    };

    return (
        <div className="bg-gray-50">
        {loading ? <Loader /> : error ? <Message variant="danger">{error}</Message> : !product ? <Message variant="danger">Product Not Found</Message> :
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to='/' className="inline-block bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 mb-6 transition">Go Back</Link>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1"><img className="w-full rounded-lg shadow-lg" src={product.image} alt={product.name} /></div>
                <div className="md:col-span-1 lg:col-span-1">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
                    <div className="border-t border-b border-gray-200 py-3 my-3"><Rating rating={product.rating} numReviews={product.numReviews} /></div>
                    <p className="text-2xl font-semibold my-3">Price: Rs {product.price}</p>
                    <p className="text-gray-600">{product.description}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                   <div className="border rounded-lg shadow-sm p-4 bg-white">
                        <div className="flex justify-between py-2 border-b"><span className="font-semibold">Price:</span><span>Rs {product.price}</span></div>
                        <div className="flex justify-between py-2 border-b"><span className="font-semibold">Status:</span><span>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></div>
                        {product.stock > 0 && (
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="font-semibold">Qty:</span>
                                <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="p-2 border rounded">
                                    {[...Array(product.stock).keys()].map(x => (<option key={x + 1} value={x + 1}>{x + 1}</option>))}
                                </select>
                            </div>
                        )}
                        <button onClick={addToCartHandler} className="w-full bg-gray-800 text-white py-3 mt-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition" disabled={product.stock === 0}>Add To Cart</button>
                   </div>
                </div>
            </div>
        </div>}
        </div>
    );
};

const CartScreen = () => {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart: { cartItems } } = state;

    const updateCartHandler = async (item, qty) => {
        const { data } = await axios.get(`/api/products/${item._id}`);
        if (data.stock < qty) {
          alert('Sorry. Product is out of stock');
          return;
        }
        ctxDispatch({ type: 'CART_ADD_ITEM', payload: { ...item, qty } });
    };

    const removeItemHandler = (item) => {
        ctxDispatch({ type: 'CART_REMOVE_ITEM', payload: item });
    };

    const checkoutHandler = () => {
        navigate('/login?redirect=/shipping');
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Shopping Cart</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {cartItems.length === 0 ? (<Message>Cart is empty. <Link to='/' className="underline font-semibold hover:text-blue-700">Go Shopping</Link></Message>) : (
                        <div className="space-y-4">
                            {cartItems.map(item => (
                                <div key={item._id} className="flex items-center p-4 border rounded-lg shadow-sm bg-white">
                                    <div className="w-1/6"><img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" /></div>
                                    <div className="w-2/6"><Link to={`/product/${item._id}`} className="text-lg font-medium hover:underline">{item.name}</Link></div>
                                    <div className="w-1/6">
                                        <button onClick={() => updateCartHandler(item, item.qty - 1)} disabled={item.qty === 1} className="text-gray-500 hover:text-black disabled:text-gray-300"><i className="fas fa-minus-circle"></i></button>
                                        <span className="mx-2 font-bold">{item.qty}</span>
                                        <button onClick={() => updateCartHandler(item, item.qty + 1)} disabled={item.qty >= item.stock} className="text-gray-500 hover:text-black disabled:text-gray-300"><i className="fas fa-plus-circle"></i></button>
                                    </div>
                                    <div className="w-1/6 font-semibold text-lg">${item.price}</div>
                                    <div className="w-1/6 text-right"><button onClick={() => removeItemHandler(item)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1">
                    <div className="border rounded-lg shadow-sm p-4 bg-white">
                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">Subtotal ({cartItems.reduce((a, c) => a + c.qty, 0)} items)</h2>
                        <p className="text-xl font-semibold mb-4">${cartItems.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2)}</p>
                        <button onClick={checkoutHandler} className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition" disabled={cartItems.length === 0}>Proceed To Checkout</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const { search } = useLocation();
    const redirectInUrl = new URLSearchParams(search).get('redirect');
    const redirect = redirectInUrl ? redirectInUrl : '/';

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo } = state;

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post('/api/users/login', { email, password });
            ctxDispatch({ type: 'USER_LOGIN', payload: data });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate(redirect || '/');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-800">Sign In</h1>
                {error && <Message variant='danger'>{error}</Message>}
                <form onSubmit={submitHandler} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <button type="submit" className="w-full py-3 px-4 text-white bg-gray-800 rounded-md hover:bg-gray-700 flex justify-center items-center" disabled={loading}>
                        {loading ? <Loader/> : 'Sign In'}
                    </button>
                </form>
                <div className="text-center"><p className="text-sm">New Customer? <Link to={`/register?redirect=${redirect}`} className="font-medium text-indigo-600 hover:text-indigo-500">Register</Link></p></div>
            </div>
        </div>
    );
};

const RegisterScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { search } = useLocation();
    const redirectInUrl = new URLSearchParams(search).get('redirect');
    const redirect = redirectInUrl ? redirectInUrl : '/';

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo } = state;

    const submitHandler = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post('/api/users', { name, email, password });
            ctxDispatch({ type: 'USER_LOGIN', payload: data });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate(redirect || '/');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-800">Register</h1>
                {error && <Message variant='danger'>{error}</Message>}
                <form onSubmit={submitHandler} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <button type="submit" className="w-full py-3 px-4 text-white bg-gray-800 rounded-md hover:bg-gray-700 flex justify-center items-center" disabled={loading}>
                        {loading ? <Loader/> : 'Register'}
                    </button>
                </form>
                <div className="text-center"><p className="text-sm">Already have an account? <Link to={`/login?redirect=${redirect}`} className="font-medium text-indigo-600 hover:text-indigo-500">Login</Link></p></div>
            </div>
        </div>
    );
};

const ShippingScreen = () => {
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart: { shippingAddress } } = state;
    const [fullName, setFullName] = useState(shippingAddress.fullName || '');
    const [address, setAddress] = useState(shippingAddress.address || '');
    const [city, setCity] = useState(shippingAddress.city || '');
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
    const [country, setCountry] = useState(shippingAddress.country || '');
    const navigate = useNavigate();

    const submitHandler = (e) => {
        e.preventDefault();
        ctxDispatch({ type: 'SAVE_SHIPPING_ADDRESS', payload: { fullName, address, city, postalCode, country } });
        navigate('/payment');
    };

    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <CheckoutSteps step1 step2 />
                <h1 className="text-3xl font-bold text-center text-gray-800">Shipping Address</h1>
                <form onSubmit={submitHandler} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                        <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <button type="submit" className="w-full py-3 px-4 text-white bg-gray-800 rounded-md hover:bg-gray-700">Continue</button>
                </form>
            </div>
        </div>
    );
};

const PaymentScreen = () => {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart: { shippingAddress, paymentMethod } } = state;
    const [paymentMethodName, setPaymentMethod] = useState(paymentMethod || 'PayPal');
    
    useEffect(() => {
        if(!shippingAddress.address) {
            navigate('/shipping');
        }
    }, [shippingAddress, navigate]);

    const submitHandler = (e) => {
        e.preventDefault();
        ctxDispatch({ type: 'SAVE_PAYMENT_METHOD', payload: paymentMethodName });
        navigate('/placeorder');
    };
    
    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <CheckoutSteps step1 step2 step3 />
                <h1 className="text-3xl font-bold text-center text-gray-800">Payment Method</h1>
                <form onSubmit={submitHandler} className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center p-4 border rounded-lg">
                            <input type="radio" id="PayPal" value="PayPal" name="paymentMethod" className="h-4 w-4 text-indigo-600 border-gray-300" checked={paymentMethodName === 'PayPal'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <label htmlFor="PayPal" className="ml-3 block text-sm font-medium text-gray-700">PayPal or Credit Card</label>
                        </div>
                         <div className="flex items-center p-4 border rounded-lg">
                            <input type="radio" id="Stripe" value="Stripe" name="paymentMethod" className="h-4 w-4 text-indigo-600 border-gray-300" checked={paymentMethodName === 'Stripe'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <label htmlFor="Stripe" className="ml-3 block text-sm font-medium text-gray-700">Stripe</label>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 px-4 text-white bg-gray-800 rounded-md hover:bg-gray-700">Continue</button>
                </form>
            </div>
        </div>
    );
};

const PlaceOrderScreen = () => {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo, cart } = state;
    const { cartItems, shippingAddress, paymentMethod } = cart;

    const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;
    cart.itemsPrice = round2(cartItems.reduce((a, c) => a + c.qty * c.price, 0));
    cart.shippingPrice = cart.itemsPrice > 100 ? round2(0) : round2(10);
    cart.taxPrice = round2(0.15 * cart.itemsPrice);
    cart.totalPrice = cart.itemsPrice + cart.shippingPrice + cart.taxPrice;
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const placeOrderHandler = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post('/api/orders', {
                orderItems: cartItems,
                shippingAddress,
                paymentMethod,
                itemsPrice: cart.itemsPrice,
                shippingPrice: cart.shippingPrice,
                taxPrice: cart.taxPrice,
                totalPrice: cart.totalPrice,
            }, {
                headers: {
                    authorization: `Bearer ${userInfo.token}`,
                },
            });
            ctxDispatch({ type: 'CART_CLEAR' });
            localStorage.removeItem('cartItems');
            setLoading(false);
            navigate(`/order/${data.order._id}`);
        } catch(err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if(!paymentMethod) {
            navigate('/payment');
        }
    }, [paymentMethod, navigate]);
    
    return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CheckoutSteps step1 step2 step3 step4 />
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Place Order</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-3">Shipping</h2>
                        <p><strong>Name:</strong> {shippingAddress.fullName}</p>
                        <p><strong>Address:</strong> {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.postalCode}, {shippingAddress.country}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-3">Payment Method</h2>
                        <p><strong>Method:</strong> {paymentMethod}</p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-3">Order Items</h2>
                        <div className="space-y-4">
                             {cartItems.map(item => (
                                <div key={item._id} className="flex items-center">
                                    <div className="w-1/6"><img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" /></div>
                                    <div className="w-3/6"><Link to={`/product/${item._id}`} className="hover:underline">{item.name}</Link></div>
                                    <div className="w-2/6 text-right">{item.qty} x ${item.price} = ${item.qty * item.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Order Summary</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between"><span>Items</span><span>${cart.itemsPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Shipping</span><span>${cart.shippingPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax</span><span>${cart.taxPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Order Total</span><span>${cart.totalPrice.toFixed(2)}</span></div>
                        </div>
                        <button onClick={placeOrderHandler} className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 flex justify-center items-center" disabled={cartItems.length === 0 || loading}>
                            {loading ? <Loader/> : 'Place Order'}
                        </button>
                        {error && <div className="mt-4"><Message variant="danger">{error}</Message></div>}
                    </div>
                </div>
            </div>
         </div>
    );
};

const OrderScreen = () => {
    const { state } = useContext(Store);
    const { userInfo } = state;
    const params = useParams();
    const { id: orderId } = params;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [order, setOrder] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/orders/${orderId}`, {
                    headers: { authorization: `Bearer ${userInfo.token}` },
                });
                setOrder(data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, userInfo]);

    return loading ? <Loader/> : error ? <Message variant="danger">{error}</Message> : !order ? <Message variant="danger">Order Not Found</Message> : (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Order {order._id}</h1>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-3">Shipping</h2>
                        <p><strong>Name:</strong> {order.shippingAddress.fullName}</p>
                        <p><strong>Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                        {order.isDelivered ? <Message variant="success">Delivered at {order.deliveredAt}</Message> : <Message variant="danger">Not Delivered</Message>}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-3">Payment</h2>
                        <p><strong>Method:</strong> {order.paymentMethod}</p>
                         {order.isPaid ? <Message variant="success">Paid at {order.paidAt}</Message> : <Message variant="danger">Not Paid</Message>}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-3">Order Items</h2>
                         <div className="space-y-4">
                             {order.orderItems.map(item => (
                                <div key={item._id} className="flex items-center">
                                    <div className="w-1/6"><img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" /></div>
                                    <div className="w-3/6"><Link to={`/product/${item._id}`} className="hover:underline">{item.name}</Link></div>
                                    <div className="w-2/6 text-right">{item.qty} x ${item.price} = ${item.qty * item.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Order Summary</h2>
                         <div className="space-y-2">
                            <div className="flex justify-between"><span>Items</span><span>${order.itemsPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Shipping</span><span>${order.shippingPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax</span><span>${order.taxPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Order Total</span><span>${order.totalPrice.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileScreen = () => {
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo } = state;
    const [name, setName] = useState(userInfo.name);
    const [email, setEmail] = useState(userInfo.email);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const submitHandler = async (e) => {
        e.preventDefault();
        if(password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            const { data } = await axios.put('/api/users/profile', { name, email, password }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            ctxDispatch({ type: 'USER_LOGIN', payload: data });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
         <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-800">User Profile</h1>
                 {error && <Message variant='danger'>{error}</Message>}
                 {success && <Message variant='success'>Profile Updated Successfully</Message>}
                <form onSubmit={submitHandler} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <button type="submit" className="w-full py-3 px-4 text-white bg-gray-800 rounded-md hover:bg-gray-700 flex justify-center items-center" disabled={loading}>
                        {loading ? <Loader/> : 'Update'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const OrderHistoryScreen = () => {
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get('/api/orders/myorders', {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                setOrders(data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [userInfo]);

    return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Order History</h1>
            {loading ? <Loader/> : error ? <Message variant="danger">{error}</Message> : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order._id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.createdAt.substring(0, 10)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.totalPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{order.isPaid ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{order.paidAt.substring(0, 10)}</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{order.isDelivered ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{order.deliveredAt.substring(0, 10)}</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => navigate(`/order/${order._id}`)} className="text-indigo-600 hover:text-indigo-900">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- ADMIN SCREENS ---
const UserListScreen = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const { state } = useContext(Store);
    const { userInfo } = state;
    
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get('/api/users', { headers: { Authorization: `Bearer ${userInfo.token}` } });
                setUsers(data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [userInfo]);
    
    return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Users</h1>
             {loading ? <Loader/> : error ? <Message variant="danger">{error}</Message> : (
                 <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-200">
                             {users.map(user => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user._id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.isAdmin ? <i className="fas fa-check text-green-500"></i> : <i className="fas fa-times text-red-500"></i>}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            )}
        </div>
    );
};

const ProductListScreen = () => {
    // ... complete implementation ...
    return <div>Admin Product List</div>
};
const ProductEditScreen = () => {
    // ... complete implementation ...
    return <div>Admin Product Edit</div>
};
const OrderListScreen = () => {
    // ... complete implementation ...
    return <div>Admin Order List</div>
};


// --- MAIN APP LAYOUT & ROUTING ---
const AppLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-100">
    <Header />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorElement />,
    children: [
      { path: '/', element: <HomeScreen /> },
      { path: '/product/:id', element: <ProductScreen /> },
      { path: '/cart', element: <CartScreen /> },
      { path: '/login', element: <LoginScreen /> },
      { path: '/register', element: <RegisterScreen /> },
      { path: '/shipping', element: <ProtectedRoute><ShippingScreen /></ProtectedRoute> },
      { path: '/payment', element: <ProtectedRoute><PaymentScreen /></ProtectedRoute> },
      { path: '/placeorder', element: <ProtectedRoute><PlaceOrderScreen /></ProtectedRoute> },
      { path: '/order/:id', element: <ProtectedRoute><OrderScreen /></ProtectedRoute> },
      { path: '/profile', element: <ProtectedRoute><ProfileScreen /></ProtectedRoute> },
      { path: '/orderhistory', element: <ProtectedRoute><OrderHistoryScreen /></ProtectedRoute> },
      
      { path: '/admin/userlist', element: <AdminRoute><UserListScreen /></AdminRoute> },
      { path: '/admin/productlist', element: <AdminRoute><ProductListScreen /></AdminRoute> },
      { path: '/admin/product/:id/edit', element: <AdminRoute><ProductEditScreen /></AdminRoute> },
      { path: '/admin/orderlist', element: <AdminRoute><OrderListScreen /></AdminRoute> },
    ],
  },
]);

const App = () => (
  <StoreProvider>
    <RouterProvider router={router} />
  </StoreProvider>
);

export default App;

