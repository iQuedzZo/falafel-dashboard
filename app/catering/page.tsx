export default function Catering() {

    const cateringOrders = [
      {
        id: 1,
        company: "ABC Construction",
        date: "July 22, 2026",
        time: "11:30 AM",
        guests: 45,
        items: [
          "20 Chicken Shawarma",
          "15 Falafel Plates",
          "10 Fries"
        ],
        status: "New Inquiry"
      },
  
      {
        id: 2,
        company: "Tracy School Event",
        date: "August 5, 2026",
        time: "12:00 PM",
        guests: 80,
        items: [
          "40 Falafel Wraps",
          "40 Shawarma Wraps"
        ],
        status: "Confirmed"
      }
    ];
  
  
    return (
      <div className="p-8">
  
        <h1 className="text-3xl font-bold mb-6">
          Catering Orders
        </h1>
  
  
        <div className="space-y-5">
  
          {cateringOrders.map((order) => (
  
            <div
              key={order.id}
              className="bg-white rounded-xl shadow p-6"
            >
  
              <h2 className="text-xl font-bold">
                {order.company}
              </h2>
  
  
              <p className="mt-2">
                Event Date: {order.date}
              </p>
  
              <p>
                Time: {order.time}
              </p>
  
              <p>
                Guests: {order.guests}
              </p>
  
  
              <div className="mt-4">
  
                <h3 className="font-bold">
                  Order Details
                </h3>
  
                {order.items.map((item) => (
                  <p key={item}>
                    • {item}
                  </p>
                ))}
  
              </div>
  
  
              <p className="mt-4">
                Status:
  
                <span className="font-bold ml-2">
                  {order.status}
                </span>
  
              </p>
  
  
              <div className="flex gap-3 mt-4">
  
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                  Contacted
                </button>
  
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg">
                  Confirmed
                </button>
  
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
                  Delivered
                </button>
  
              </div>
  
  
            </div>
  
          ))}
  
        </div>
  
  
      </div>
    );
  }