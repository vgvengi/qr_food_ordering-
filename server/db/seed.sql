USE qr_food_order;

INSERT INTO dining_tables (label, qr_token) VALUES
  ('T1','t1a8f3k2m9qz'), ('T2','t2b7d4n1p8wx'), ('T3','t3c6e5r0s7vy'),
  ('T4','t4d5f6t9u6uw'), ('T5','t5e4g7v8w5tv');

INSERT INTO categories (id, name, sort_order) VALUES
  (1,'Starters',1), (2,'Mains',2), (3,'Breads',3), (4,'Drinks',4), (5,'Desserts',5);

INSERT INTO menu_items (category_id, name, description, price_paise, is_veg) VALUES
  (1,'Paneer Tikka','Chargrilled cottage cheese, mint chutney',24000,TRUE),
  (1,'Chicken 65','Spicy fried chicken, curry leaves',26000,FALSE),
  (1,'Gobi Manchurian','Crispy cauliflower in Indo-Chinese sauce',18000,TRUE),
  (2,'Butter Chicken','Tandoori chicken in tomato-butter gravy',32000,FALSE),
  (2,'Dal Makhani','Slow-cooked black lentils, cream',22000,TRUE),
  (2,'Veg Biryani','Basmati rice, vegetables, raita',24000,TRUE),
  (2,'Chicken Biryani','Hyderabadi dum biryani, raita',30000,FALSE),
  (3,'Butter Naan','Tandoor-baked',6000,TRUE),
  (3,'Garlic Naan','Tandoor-baked with garlic',7000,TRUE),
  (4,'Masala Chai','Spiced Indian tea',4000,TRUE),
  (4,'Sweet Lassi','Chilled yogurt drink',8000,TRUE),
  (4,'Fresh Lime Soda','Sweet or salted',7000,TRUE),
  (5,'Gulab Jamun','Two pieces, warm',9000,TRUE),
  (5,'Rasmalai','Two pieces, chilled',11000,TRUE);
