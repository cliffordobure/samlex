const Loading = ({ message = "Loading..." }) => {
  return (
    <div 
      className="min-h-screen bg-dark-900 flex items-center justify-center"
      style={{ 
        backgroundColor: '#0f172a', 
        color: '#cbd5e1',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"
          style={{
            borderColor: '#0ea5e9',
            borderTopColor: 'transparent'
          }}
        ></div>
        <p 
          className="text-dark-300"
          style={{ color: '#cbd5e1' }}
        >{message}</p>
      </div>
    </div>
  );
};

export default Loading;
