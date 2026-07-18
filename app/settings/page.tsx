export default function Settings() {
    return (
      <div className="p-8">
  
        <h1 className="text-3xl font-bold mb-6">
          Settings
        </h1>
  
  
        <div className="bg-white rounded-xl shadow p-6 space-y-5">
  
  
          <div>
            <label className="font-bold">
              Restaurant Name
            </label>
  
            <input
              className="border rounded-lg p-3 w-full mt-2"
              value="Falafel Flare"
              readOnly
            />
          </div>
  
  
  
          <div>
            <label className="font-bold">
              Business Hours
            </label>
  
            <input
              className="border rounded-lg p-3 w-full mt-2"
              value="11:00 AM - 9:00 PM"
              readOnly
            />
          </div>
  
  
  
          <div>
            <label className="font-bold">
              Pickup Preparation Time
            </label>
  
            <input
              className="border rounded-lg p-3 w-full mt-2"
              value="20 minutes"
              readOnly
            />
          </div>
  
  
  
          <div>
            <label className="font-bold">
              AI Assistant Name
            </label>
  
            <input
              className="border rounded-lg p-3 w-full mt-2"
              value="Alex"
              readOnly
            />
          </div>
  
  
  
        </div>
  
  
      </div>
    );
  }