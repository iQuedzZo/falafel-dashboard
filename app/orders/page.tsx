"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export default function Orders() {


  const [orders, setOrders] = useState<any[]>([]);

  const [notification, setNotification] = useState<any>(null);

  const [now, setNow] = useState(Date.now());



  function getTimerColor(time: string) {

    const minutes = Math.floor(
      (Date.now() - new Date(time).getTime()) / 60000
    );


    if (minutes < 5) {
      return "text-green-600";
    }


    if (minutes < 10) {
      return "text-yellow-600";
    }


    return "text-red-600";

  }




  function getTimeAgo(time: string) {


    const seconds = Math.floor(
      (now - new Date(time).getTime()) / 1000
    );



    if (seconds < 0) {
      return "Just now";
    }



    if (seconds < 60) {
      return `${seconds}s ago`;
    }



    const minutes = Math.floor(seconds / 60);



    if (minutes < 60) {
      return `${minutes} min ago`;
    }



    const hours = Math.floor(minutes / 60);


    return `${hours} hr ago`;

  }





  async function getOrders() {


    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("order_time", {
        ascending: false,
      });



    if (error) {

      console.log(
        "SUPABASE ERROR:",
        error
      );

      return;

    }



    setOrders(data || []);

  }





  useEffect(() => {


    getOrders();



    const timer = setInterval(() => {

      setNow(Date.now());

    }, 10000);




    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },

        (payload) => {


          if (payload.eventType === "INSERT") {


            const audio = new Audio(
              "/sounds/ding.mp3"
            );


            audio.play()
            .catch(() => {});



            setNotification(
              payload.new
            );



            setTimeout(() => {

              setNotification(null);

            }, 5000);

          }



          getOrders();


        }

      )
      .subscribe();




    return () => {


      clearInterval(timer);


      supabase.removeChannel(
        channel
      );


    };


  }, []);
  async function updateStatus(
    id:number,
    status:string
  ) {


    const { error } = await supabase
      .from("orders")
      .update({
        status: status
      })
      .eq("id", id);



    if(error){

      console.log(
        "UPDATE ERROR:",
        error
      );

      return;

    }


    getOrders();


  }




  const statuses = [
    "New",
    "Preparing",
    "Ready",
    "Completed"
  ];
  const totalOrders = orders.length;


  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum + Number(order.price || 0),
    0
  );
  
  
  const averageOrder =
    totalOrders > 0
    ? totalRevenue / totalOrders
    : 0;
  
  
  const activeOrders = orders.filter(
    order =>
      order.status !== "Completed"
  ).length;



  return (

    <>


    {notification && (

      <div className="fixed top-5 right-5 bg-green-700 text-white p-5 rounded-xl shadow-2xl z-50 w-80 animate-pulse">

        <h2 className="font-bold text-xl">
          🔔 NEW ORDER
        </h2>


        <p className="mt-2">
          👤 {notification.customer_name}
        </p>


        <p>
          🍽 {notification.items}
        </p>


      </div>

    )}





    <div className="p-8">


      <h1 className="text-3xl font-bold mb-8">
        Order Management
      </h1>
      <div className="grid grid-cols-4 gap-5 mb-8">


<div className="bg-white rounded-xl shadow p-5">

  <p className="text-gray-500">
    Orders
  </p>

  <h2 className="text-3xl font-bold">
    {totalOrders}
  </h2>

</div>




<div className="bg-white rounded-xl shadow p-5">

  <p className="text-gray-500">
    Revenue
  </p>

  <h2 className="text-3xl font-bold">
    ${totalRevenue.toFixed(2)}
  </h2>

</div>





<div className="bg-white rounded-xl shadow p-5">

  <p className="text-gray-500">
    Avg Order
  </p>

  <h2 className="text-3xl font-bold">
    ${averageOrder.toFixed(2)}
  </h2>

</div>





<div className="bg-white rounded-xl shadow p-5">

  <p className="text-gray-500">
    Active
  </p>

  <h2 className="text-3xl font-bold">
    {activeOrders}
  </h2>

</div>



</div>




      <div className="grid grid-cols-4 gap-5">



      {statuses.map((status) => (


        <div
        key={status}
        className="bg-gray-100 rounded-xl p-4 min-h-[600px]"
        >



          <div className="flex justify-between items-center mb-4">


            <h2 className="font-bold text-xl">
              {status}
            </h2>



            <span className="bg-white px-3 py-1 rounded-full text-sm">

              {
                orders.filter(
                  order => order.status === status
                ).length
              }

            </span>


          </div>





          <div className="space-y-4">



          {orders
          .filter(
            order =>
              order.status === status
          )
          .map((order) => (



            <div
            key={order.id}
            className="bg-white rounded-xl shadow p-4"
            >



              <div className="flex justify-between items-start">



                <div>


                  <h3 className="font-bold text-lg">
                    Order #{order.id}
                  </h3>



                  <p className="text-gray-700 mt-1">
                    👤 {order.customer_name}
                  </p>



                  {order.phone && (

                    <p className="text-gray-500 text-sm">
                      📞 {order.phone}
                    </p>

                  )}


                </div>





                <span
                className={`px-3 py-1 rounded-full text-sm font-semibold

                ${
                  order.status === "New"
                  ? "bg-blue-100 text-blue-700"

                  :

                  order.status === "Preparing"
                  ? "bg-orange-100 text-orange-700"

                  :

                  order.status === "Ready"
                  ? "bg-green-100 text-green-700"

                  :

                  "bg-gray-200 text-gray-700"
                }

                `}
                >

                  {order.status}

                </span>



              </div>






              <div className="mt-4">


                <p className="font-medium">
                  🍽 Items
                </p>


                <p className="text-gray-600">
                  {order.items}
                </p>


              </div>







              {order.order_time && (

                <div className="mt-3 space-y-1">


                  <p className="text-sm text-gray-400">

                    🕒 {
                      new Date(
                        order.order_time
                      ).toLocaleTimeString()
                    }

                  </p>





                  <p
                  className={`
                  text-sm font-medium

                  ${getTimerColor(order.order_time)}

                  `}
                  >

                    ⏱ {getTimeAgo(order.order_time)}

                  </p>



                </div>

              )}







              <div className="mt-4 flex gap-2">



                {status !== "Preparing" && (

                  <button
                  onClick={() =>
                    updateStatus(
                      order.id,
                      "Preparing"
                    )
                  }

                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg"
                  >

                    Preparing

                  </button>

                )}






                {status !== "Ready" && (

                  <button
                  onClick={() =>
                    updateStatus(
                      order.id,
                      "Ready"
                    )
                  }

                  className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
                  >

                    Ready

                  </button>

                )}






                {status !== "Completed" && (

                  <button
                  onClick={() =>
                    updateStatus(
                      order.id,
                      "Completed"
                    )
                  }

                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg"
                  >

                    Done

                  </button>

                )}



              </div>





            </div>



          ))}




          </div>



        </div>



      ))}



      </div>




    </div>


    </>

  );


}