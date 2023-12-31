import { defs, tiny } from './examples/common.js';
import { VehicleManager } from './examples/common.js';
import { Text_Line } from './examples/text-demo.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;
const red = color(1, 0, 0, 1); // Red color, fully opaque
const white = color(1, 1, 1, 1); // White color, fully opaque
const grey = color(0.5, 0.5, 0.5, 1);

const streets = [
    { spawnPoint: vec3(-10, 0, -10), cooldown: 0 },
    { spawnPoint: vec3(0, 0, -10), cooldown: 0 },
    { spawnPoint: vec3(10, 0, -10), cooldown: 0 },
    // ... other streets
];
const cooldownDuration = 1; // 1 second
function getRandomVehicleType() {
    //const vehicleTypes = ['Car']
    const vehicleTypes = ['Car', 'Van', 'Starship'];
    const randomIndex = Math.floor(Math.random() * vehicleTypes.length);
    return vehicleTypes[randomIndex];
}
function updateSpawning(deltaTime) {
    streets.forEach(street => {
        // Decrease the cooldown timer
        if (street.cooldown > 0) {
            street.cooldown -= deltaTime;
        }

        // Check if it's time to spawn a new vehicle
        if (street.cooldown <= 0) {
            // Randomly decide whether to spawn a vehicle
            if (Math.random() < 0.5) { // 50% chance to spawn a vehicle
                spawnVehicleAtStreet(street);
                street.cooldown = cooldownDuration; // Reset cooldown
            }
        }
    });
}

function spawnVehicleAtStreet(street) {
    const vehicleType = getRandomVehicleType();

    // Define the vehicle's path 
    const path = { start: street.spawnPoint, end: vec3(street.spawnPoint.x, street.spawnPoint.y, street.spawnPoint.z + 20), speed: 0.5 };

    let vehicle;
    switch (vehicleType) {
        case 'Car':
            vehicle = new defs.Car(car_materials, path, car_shapes, vec3(0, 1, 0));
            break;
        case 'Van':
            vehicle = new defs.Van(van_materials, path, van_shapes, vec3(0, 1, 0));
            break;
        case 'Starship':
            vehicle = new defs.Starship(starship_materials, path, starship_shapes, vec3(0, 1, 0));
            break;
        // Add cases for other vehicle types
    }

    this.vehicle_manager.add_vehicle(vehicle);
}

// Obtain random integer between min(inclusive) and max(inclusive)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * ((max - min) + 1) + min);
}
function getRandomDouble(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomColor() {
    // Define an array of specified hex color values
    const hexColors = ["#FF0000", "#008000", "#800080", "#0000FF", "#808080", "#FFFF00", "#FFA500"];
    // Randomly select and return a hex color from the array
    const randomIndex = Math.floor(Math.random() * hexColors.length);
    return hexColors[randomIndex];
}



// input road translations in road
function overlapWithRoad(i, ... road_positions) {
    // return true if road overlaps
    for (const road of road_positions) {
        if (i < road + 3 && i > road - 3) {
            return true;
        }
    }
    return false;
}


export class Bruinwalk_Main_Program extends Scene {
    constructor() {
        super();

        this.shapes = {
            //starship: new defs.Starship(),
            rock: new defs.Rock(),
            tree: new defs.Tree(),
            floor: new defs.Floor(),
            sky: new defs.Sky(),
            road: new defs.Road(),
            finishLine: new defs.Finish_Line(),
            bear_body: new defs.Bear_Body(),
            bear_face: new defs.Bear_Face(),
            bear_limbs1: new defs.Bear_Limbs1(),
            bear_limbs2: new defs.Bear_Limbs2(),
            text: new Text_Line(35),
        };

        // *** Materials
        this.materials = {
            car: new Material(new defs.Phong_Shader(),
                { ambient: 0, diffusivity: 1, color: hex_color("#F0F0F0"), specularity: 1 }),
            starship: new Material(new defs.Phong_Shader(),
                { ambient: 0.5, diffusivity: 0.5, color: hex_color("#F0F0F0") }),
            rock: new Material(new defs.Phong_Shader(),
                { ambient: 1, color: hex_color("#5A5A5A") }),
            tree_stump: new Material(new defs.Phong_Shader(),
                { color: hex_color("#8B4513") }),
            tree_top: new Material(new defs.Phong_Shader(),
                { color: hex_color("#42692F") }),
            floor: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.5, specularity: 1, color: hex_color("#90EE90") }),
            sky: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.5, specularity: 1, color: hex_color("#87CEEB") }),
            road: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.5, specularity: 1, color: hex_color("#777B7E") }),
            road_dash: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0.5, specularity: 1, color: hex_color("#FFFF00")}),
            finishLine: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0.5, specularity: 1, color: hex_color("#000000")}),
            bear: new Material(new defs.Phong_Shader(),
                { ambient: 0.5, diffusivity: 0.5, color: hex_color("#954535") }),
        }
        const texture = new defs.Textured_Phong(1);
        this.text_image = new Material(texture, {
            ambient: 1, diffusivity: 0, specularity: 0,
            texture: new Texture("assets/text.png")
        });

        // 60 x 40 field
        let field_length = 60;    // horizontal length of field
        let field_width = 40;     // vertical width of field

        this.direction = 1;
        this.x_movement = 0; //x movement is bound by 0 to 2*x-width of screen
        this.z_movement = 0; //z movement is bound by -z-width to +z-width of screen
        this.start_animation = 0; //Flag for when to show start screen, when to pan to game
        this.end_animation = false;
        this.game_win = true;
        this.rock_positions = [];
        this.tree_positions = [];
        // array for road positions
        this.road_positions = [-40, -18, -12, 12, 18, 40];
        this.road_spawn_details = [
            {
                x: -40,
                spawnTimes: [1, 5, 9, 13],
                directions: [1, -1, 1, -1]
            },
            {
                x: -18,
                spawnTimes: [2, 6, 10, 14],
                directions: [-1, 1, -1, 1]
            },
            {
                x: -12,
                spawnTimes: [3, 7, 11, 15],
                directions: [1, -1, 1, -1]
            },
            {
                x: 12,
                spawnTimes: [4, 8, 12, 16],
                directions: [-1, 1, -1, 1]
            },
            {
                x: 18,
                spawnTimes: [5, 9, 13, 17],
                directions: [1, -1, 1, -1]
            },
            {
                x: 40,
                spawnTimes: [6, 10, 14, 18],
                directions: [-1, 1, -1, 1]
            }
        ]
        const starship_path1 = { start: vec3(12, 0, -70), end: vec3(12, 0, 70), speed: 0.5 };
        const starship_path2 = { start: vec3(4, 0, 20), end: vec3(4, 0, -10), speed: 0.4 };
        const car_path = { start: vec3(4, 0, 20), end: vec3(4, 0, -10), speed: 0.5 };
        const van_path = { start: vec3(14, 0, 20), end: vec3(14, 0, -10), speed: getRandomDouble(0.3, 0.6) };



        let i = 0;
        let j = 0;







        // randomly populate field with rocks and trees
        // if randomInt = 1 -> rock, 2 -> tree, rest -> blank square
        for (i = -field_length + 4; i <= field_length - 6; i += 2) {    // give bear 2 columns of space with no blocks at start and 3 columns of space at end for finish line
            if (!overlapWithRoad(i, -40, -18, -12, 12, 18, 40)) {
                for (j = -field_width; j <= field_width; j += 2) {
                    let randomInt = getRandomInt(1,30);      // gets random int between 1 and 30 (increase range to make field less dense)
                    if (randomInt === 1) {
                        this.rock_positions.push(vec3(i,0,j));      // stores position in rock_positions array
                    }
                    else if (randomInt === 2) {
                        this.tree_positions.push(vec3(i,0,j));      // stores position in tree_positions array
                    }
                }
            }
        }

        this.starship_shapes = {
            body: new defs.Cube(),
            pole: new defs.Capped_Cylinder(4, 4),
            flag: new defs.Square(),
            wheel: new defs.Torus(15, 15)
        };
        this.starship_materials = {
            starship: new Material(new defs.Phong_Shader(), { ambient: 0, diffusivity: 1, color: hex_color("#F0F0F0"), specularity: 1 }),
            body: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: white }),
            pole: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            flag: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: red }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
        };



        this.van_shapes = {
            body: new defs.Cube(),
            wheel: new defs.Torus(15, 15),
            window: new defs.Cube()
        };

        this.van_materials = {
            body: new Material(new defs.Phong_Shader(),

                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color(getRandomColor()) }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            window: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
        };
        this.redvan_materials = {
            body: new Material(new defs.Phong_Shader(),

                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("FF0000") }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            window: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
        };
        this.greenvan_materials = {
            body: new Material(new defs.Phong_Shader(),

                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("00FF00") }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            window: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
        };
        this.bluevan_materials = {
            body: new Material(new defs.Phong_Shader(),

                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("0000FF") }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            window: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
        };

        const van_direction = vec3(0, -1, 0); // For van going right to left

        this.car_shapes = {
            body: new defs.Cube(),
            hood: new defs.Cube(),
            wheel: new defs.Torus(15, 15),
            driverArea: new defs.Cube(),
            window: new defs.Cube()
        };

        this.redcar_materials = {
            body: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("FF0000") }),
            hood: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#FFD580") }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            driverArea: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#F0F0F0") }),
            window: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),

            // Define other materials if needed
        };
        this.greencar_materials = {
            body: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("00FF00") }),
            hood: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#FFD580") }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            driverArea: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#F0F0F0") }),
            window: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),

            // Define other materials if needed
        };
        this.bluecar_materials = {
            body: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("0000FF") }),
            hood: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#FFD580") }),
            wheel: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),
            driverArea: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#F0F0F0") }),
            window: new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: 0.1, specularity: 0.1, color: hex_color("#000000") }),

            // Define other materials if needed
        };

        const car_direction = vec3(0, -1, 0);


        this.vehicle_manager = new VehicleManager();

        const starship1 = new defs.Starship(this.starship_materials, starship_path1, this.starship_shapes, 1, 5, 5);
        const starship2 = new defs.Starship(this.starship_materials, starship_path2, this.starship_shapes, vec3(0, 1, 0));
        const van = new defs.Van(this.van_materials, van_path, this.van_shapes, van_direction);
        const car = new defs.Car(this.car_materials, car_path, this.car_shapes, car_direction);
        this.lastSpawnTime12 = 0;  // Initialize last spawn time
        this.lastSpawnTime18 = 0;  // Initialize last spawn time
        this.lastSpawnTime40 = 0;  // Initialize last spawn time


        // Add vehicles to the manager

        // adjusted camera back to get more complete view of field
        this.initial_camera_location = Mat4.look_at(vec3(0, 15, 60), vec3(0, 0, -120), vec3(0, 1, 0));

    }

    draw_bear(context, program_state, mt, t) {
        let angle = this.direction * Math.PI / 2; //default front, used to face the bear the correct way
        let theta = 0.2 * Math.sin(4 * Math.PI * t); //Arm/leg swing angle
        mt = mt.times(Mat4.translation(this.x_movement, 0, this.z_movement));
        mt = mt.times(Mat4.rotation(angle, 0, 1, 0)); //Rotate bear to face direction he is walking
        this.shapes.bear_body.draw(context, program_state, mt, this.materials.bear);
        this.shapes.bear_face.draw(context, program_state, mt, this.materials.bear.override({ color: hex_color("#000000") }));
        mt = mt.times(Mat4.rotation(theta, 1, 0, 0));
        this.shapes.bear_limbs1.draw(context, program_state, mt, this.materials.bear);
        mt = mt.times(Mat4.rotation(-2 * theta, 1, 0, 0));
        this.shapes.bear_limbs2.draw(context, program_state, mt, this.materials.bear);
    }
    constrain_movement(dir){
        let x_pos = this.x_movement - 60;
        for (const rock_position of this.rock_positions) {
            let rock_x_pos = rock_position[0];
            let rock_z_pos = rock_position[2];
            switch (dir) {
                case '+x':
                    if(rock_x_pos > x_pos && Math.abs(rock_z_pos - this.z_movement) <= 1 && Math.abs(x_pos - rock_x_pos) < 1.5)
                        return false;
                    break;
                case '-x':
                    if(rock_x_pos < x_pos && Math.abs(rock_z_pos - this.z_movement) <= 1 && Math.abs(x_pos - rock_x_pos) < 1.5)
                        return false;
                    break;
                case '+z':
                    if(rock_z_pos > this.z_movement && Math.abs(rock_x_pos - x_pos) <= 1 && Math.abs(this.z_movement - rock_z_pos) < 1.5)
                        return false;
                    break;
                case '-z':
                    if(rock_z_pos < this.z_movement && Math.abs(rock_x_pos - x_pos) <= 1 && Math.abs(this.z_movement - rock_z_pos) < 1.5)
                        return false;
                    break;
            }
        }
        for (const tree_position of this.tree_positions) {
            let tree_x_pos = tree_position[0];
            let tree_z_pos = tree_position[2];
            switch (dir) {
                case '+x':
                    if(tree_x_pos > x_pos && Math.abs(tree_z_pos - this.z_movement) <= 1 && Math.abs(x_pos - tree_x_pos) < 1.5)
                        return false;
                    break;
                case '-x':
                    if(tree_x_pos < x_pos && Math.abs(tree_z_pos - this.z_movement) <= 1 && Math.abs(x_pos - tree_x_pos) < 1.5)
                        return false;
                    break;
                case '+z':
                    if(tree_z_pos > this.z_movement && Math.abs(tree_x_pos - x_pos) <= 1 && Math.abs(this.z_movement - tree_z_pos) < 1.5)
                        return false;
                    break;
                case '-z':
                    if(tree_z_pos < this.z_movement && Math.abs(tree_x_pos - x_pos) <= 1 && Math.abs(this.z_movement - tree_z_pos) < 1.5)
                        return false;
                    break;
            }
        }
        return true;
    }
    make_control_panel() {
        this.key_triggered_button("Play Game", ["p"], () => {this.start_animation++;});
        this.key_triggered_button("Up", ['ArrowUp'], () => {
            if (!this.end_animation) {
            if (this.z_movement > -40) {this.z_movement--;}
            if (!this.constrain_movement('-z')) {this.z_movement++;}
            this.direction = 2;}});
        this.key_triggered_button("Down", ['ArrowDown'], () => {
            if (!this.end_animation) {
            if (this.z_movement < 40) {this.z_movement++;}
            if (!this.constrain_movement('+z')) {this.z_movement--;}
            this.direction = 0;}});
        this.key_triggered_button("Left", ['ArrowLeft'], () => {
            if (!this.end_animation) {
            if (this.x_movement > 0) {this.x_movement--;}
            if (!this.constrain_movement('-x')) {this.x_movement++;}
            this.direction = 3;}});
        this.key_triggered_button("Right", ['ArrowRight'], () => {
            if (!this.end_animation) {
            if (this.x_movement < 120) {this.x_movement++;}
            if (!this.constrain_movement('+x')) {this.x_movement--;}
            this.direction = 1;}});
    }

    displayStartText(context, program_state) {
        let strings = ["BruinWalk", "Press 'P' to Start", "Use Arrow Keys to Move"]
        let text_location = Mat4.identity().times(Mat4.translation(-8,23,-10));
        program_state.set_camera(this.initial_camera_location);
        this.shapes.text.set_string(strings[0], context.context);
        this.shapes.text.draw(context, program_state, text_location.times(Mat4.scale(1.7,1.7,1.7)), this.text_image);
        text_location.post_multiply(Mat4.translation(-12, -5, 0));
        this.shapes.text.set_string(strings[1], context.context);
        this.shapes.text.draw(context, program_state, text_location.times(Mat4.scale(1.7,1.7,1.7)), this.text_image);
        text_location.post_multiply(Mat4.translation(7, -5, 0));
        this.shapes.text.set_string(strings[2], context.context);
        this.shapes.text.draw(context, program_state, text_location, this.text_image);
    }

    pan_over(program_state) {
        const pause_duration = 1;  // Pause duration in seconds
        const animation_duration = 6;  // Duration of the camera pan
        const total_duration = pause_duration + animation_duration;  // Total duration including pause
        const t = program_state.animation_time / 1000; // Current time in seconds
        const t_normalized = Math.min(t / total_duration, 1); // Ensure t_normalized is in [0, 1]
        if (t < pause_duration)
            return;
        const interpolated_position = vec3(t_normalized * (-60), 15, 60);
        const new_camera_location = Mat4.look_at(interpolated_position, vec3(t_normalized*(-60), 0, -120), vec3(0, 1, 0));
        program_state.set_camera(new_camera_location);
        if (t_normalized == 1)
            this.start_animation++;
    }

    displayEndText(context, program_state, win) {
        let text_location = Mat4.identity().times(Mat4.translation(-68 + this.x_movement,15,-10));
        let percent_completed = (this.x_movement/120)*100;
        percent_completed = percent_completed.toFixed(0);
        let game_over_text = "You lost!";
        if (win) {game_over_text = "You won!";
        percent_completed = 100;}
        this.shapes.text.set_string(game_over_text, context.context);
        this.shapes.text.draw(context, program_state, text_location.times(Mat4.scale(1.7,1.7,1.7)), this.text_image);
        text_location.post_multiply(Mat4.translation(-17, -5, 0));
        let completion_msg = `You crossed ${percent_completed}% of the field`
        this.shapes.text.set_string(completion_msg, context.context);
        this.shapes.text.draw(context, program_state, text_location.times(Mat4.scale(1.3,1.3,1.3)), this.text_image);
        }


    display(context, program_state) {
        program_state.lights = [new Light(vec4(3, 2, 1, 0), color(1, 1, 1, 1), 1000000),
            new Light(vec4(3, 10, 10, 1), color(1, .7, .7, 1), 100000)];

        const t = program_state.animation_time / 1000; // Current time in seconds

        if (this.x_movement > 117) //If finish line is reached, play end animation
            this.end_animation = true;
        //Update where camera is looking to follow the bear:
        if(this.start_animation == 0)
           this.displayStartText(context, program_state);
        else if(this.start_animation == 1)
            this.pan_over(program_state);
        else {
            if (this.end_animation)
                this.displayEndText(context, program_state, this.game_win);
            let cam_z = this.z_movement
            if (cam_z > 13)
                cam_z = 13;
            let camera_location = Mat4.look_at(vec3((this.x_movement - 60), 15, cam_z+60), vec3(this.x_movement - 60, 0, -120), vec3(0, 1, 0));
            program_state.set_camera(camera_location);
        }


        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const light_pos = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_pos, color(1, 1, 1, 1), 1000)];

        // draws sky
        this.shapes.sky.draw(context, program_state, Mat4.identity(), this.materials.sky);

        // draws sky
        this.shapes.sky.draw(context, program_state, Mat4.identity(), this.materials.sky);

        // draws floor
        this.shapes.floor.draw(context, program_state, Mat4.identity(), this.materials.floor);

        // draws roads
        for (const road_position of this.road_positions) {
            let road_transform = Mat4.identity().times(Mat4.translation(road_position, 0, 0));
            this.shapes.road.draw(context, program_state, road_transform, this.materials.road, this.materials.road_dash);
        }

        // draws Finish Line
        let finishLine_transform = Mat4.identity()
            .times(Mat4.translation(58, 0, 0));  // field_length - 2

        this.shapes.finishLine.draw(context, program_state, finishLine_transform, this.materials.finishLine);


        //Drawing bear:
        let bear_mt = Mat4.identity();
        bear_mt = bear_mt.times(Mat4.translation(-60,2,0));
        let bear_position = vec3(this.x_movement, 0, this.z_movement); // Calculate bear's position
        this.shapes.bear_body.updatePosition(bear_position);
        this.draw_bear(context, program_state, bear_mt, t);
        
 //check for collision
 for (let vehicle of this.vehicle_manager.vehicles) {
    if (typeof vehicle.checkCollision === 'function' && vehicle.checkCollision(this.shapes.bear_body)) {
        // Handle collision (e.g., end game, reduce health, etc.)
        this.end_animation = true;
        this.game_win = false;
    }
}

// draws rocks from stored positions in constructor
for (const rock_position of this.rock_positions) {
    let rock_transform = Mat4.identity().times(Mat4.translation(rock_position[0], rock_position[1], rock_position[2]));
    this.shapes.rock.draw(context, program_state, rock_transform, this.materials.rock);
}

// draws trees from stored positions in constructor
for (const tree_position of this.tree_positions) {
    let tree_transform = Mat4.identity().times(Mat4.translation(tree_position[0], tree_position[1], tree_position[2]));
    this.shapes.tree.draw(context, program_state, tree_transform, this.materials.tree_stump, this.materials.tree_top);
}



const currentTime = program_state.animation_time / 1000; // Convert milliseconds to seconds

if (((currentTime >= 0.5) && Math.floor(currentTime) % 3 === 0 && currentTime - this.lastSpawnTime12 >= 4) || (currentTime > 1.5 && currentTime < 1.51) || ((currentTime >= 0.5) && Math.floor(currentTime) % 2 === 0 && currentTime - this.lastSpawnTime40 >= 2)) {
    let st = 12
    let startVar;
    let endVar;
    let startVar2;
    let endVar2;
    if (Math.random() < 0.5) {
        startVar = vec3(st, 0, -70);
        endVar = vec3(st, 0, 70);
        startVar2 = vec3(-1 * st, 0, 70);
        endVar2 = vec3(-1 * st, 0, -70);
    }
    else {
        startVar = vec3(st, 0, 70);
        endVar = vec3(st, 0, -70);
        startVar2 = vec3(-1 * st, 0, -70);
        endVar2 = vec3(-1 * st, 0, 70);
    }
    const path = { start: startVar, end: endVar, speed: 0.5 };
    const path2 = { start: startVar2, end: endVar2, speed: 0.5 };
    const type = getRandomVehicleType()
    const type2 = getRandomVehicleType()

    let vehicle;
    let randomNum = getRandomInt(1, 3)

    switch (type) {
        case 'Car':
            if (randomNum == 1) {
                vehicle = new defs.Car(this.redcar_materials, path, this.car_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle = new defs.Car(this.greencar_materials, path, this.car_shapes, currentTime);
            }
            else {
                vehicle = new defs.Car(this.bluecar_materials, path, this.car_shapes, currentTime);
            }
            break;
        case 'Van':
            if (randomNum == 1) {
                vehicle = new defs.Van(this.redvan_materials, path, this.van_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle = new defs.Van(this.greenvan_materials, path, this.van_shapes, currentTime);
            }
            else {
                vehicle = new defs.Van(this.bluevan_materials, path, this.van_shapes, currentTime);
            }
            break;
        case 'Starship':
            vehicle = new defs.Starship(this.starship_materials, path, this.starship_shapes, currentTime);
            break;
    }
    this.vehicle_manager.add_vehicle(vehicle);

    let vehicle2;
    switch (type2) {
        case 'Car':
            if (randomNum == 1) {
                vehicle2 = new defs.Car(this.redcar_materials, path2, this.car_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle2 = new defs.Car(this.greencar_materials, path2, this.car_shapes, currentTime);
            }
            else {
                vehicle2 = new defs.Car(this.bluecar_materials, path2, this.car_shapes, currentTime);
            } break;
        case 'Van':
            if (randomNum == 1) {
                vehicle2 = new defs.Van(this.redvan_materials, path2, this.van_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle2 = new defs.Van(this.greenvan_materials, path2, this.van_shapes, currentTime);
            }
            else {
                vehicle2 = new defs.Van(this.bluevan_materials, path2, this.van_shapes, currentTime);
            }
            break;
        case 'Starship':
            vehicle2 = new defs.Starship(this.starship_materials, path2, this.starship_shapes, currentTime);
            break;
    }
    this.vehicle_manager.add_vehicle(vehicle2);


    this.lastSpawnTime12 = currentTime; // Update last spawn time

}

if (((currentTime >= 0.5) && Math.floor(currentTime) % 3 === 0 && currentTime - this.lastSpawnTime18 >= 4) || ((currentTime > 0.5 && currentTime < 0.51) || (currentTime > 1.5 && currentTime < 1.51) || ((currentTime >= 0.5) && Math.floor(currentTime) % 2 === 0 && currentTime - this.lastSpawnTime40 >= 2))) {
    let st = 18
    let startVar;
    let endVar;
    let startVar2;
    let endVar2;
    if (Math.random() < 0.5) {
        startVar = vec3(st, 0, -70);
        endVar = vec3(st, 0, 70);
        startVar2 = vec3(-1 * st, 0, 70);
        endVar2 = vec3(-1 * st, 0, -70);
    }
    else {
        startVar = vec3(st, 0, 70);
        endVar = vec3(st, 0, -70);
        startVar2 = vec3(-1 * st, 0, -70);
        endVar2 = vec3(-1 * st, 0, 70);
    }
    const path = { start: startVar, end: endVar, speed: 0.5 };
    const path2 = { start: startVar2, end: endVar2, speed: 0.5 };
    const type = getRandomVehicleType()
    const type2 = getRandomVehicleType()
    let randomNum = getRandomInt(1, 3)
    let vehicle;
    switch (type) {
        case 'Car':
            if (randomNum == 1) {
                vehicle = new defs.Car(this.redcar_materials, path, this.car_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle = new defs.Car(this.greencar_materials, path, this.car_shapes, currentTime);
            }
            else {
                vehicle = new defs.Car(this.bluecar_materials, path, this.car_shapes, currentTime);
            } break;
        case 'Van':
            if (randomNum == 1) {
                vehicle = new defs.Van(this.redvan_materials, path, this.van_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle = new defs.Van(this.greenvan_materials, path, this.van_shapes, currentTime);
            }
            else {
                vehicle = new defs.Van(this.bluevan_materials, path, this.van_shapes, currentTime);
            }
            break;
        case 'Starship':
            vehicle = new defs.Starship(this.starship_materials, path, this.starship_shapes, currentTime);
            break;
    }
    this.vehicle_manager.add_vehicle(vehicle);

    let vehicle2;
    switch (type2) {
        case 'Car':
            if (randomNum == 1) {
                vehicle2 = new defs.Car(this.redcar_materials, path2, this.car_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle2 = new defs.Car(this.greencar_materials, path2, this.car_shapes, currentTime);
            }
            else {
                vehicle2 = new defs.Car(this.bluecar_materials, path2, this.car_shapes, currentTime);
            } break;
        case 'Van':
            if (randomNum == 1) {
                vehicle2 = new defs.Van(this.redvan_materials, path2, this.van_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle2 = new defs.Van(this.greenvan_materials, path2, this.van_shapes, currentTime);
            }
            else {
                vehicle2 = new defs.Van(this.bluevan_materials, path2, this.van_shapes, currentTime);
            }
            break;
        case 'Starship':
            vehicle2 = new defs.Starship(this.starship_materials, path2, this.starship_shapes, currentTime);
            break;
    }
    this.vehicle_manager.add_vehicle(vehicle2);


    this.lastSpawnTime18 = currentTime; // Update last spawn time

}

if ((currentTime > 0.5 && currentTime < 0.51) || (currentTime > 1.5 && currentTime < 1.51) || ((currentTime >= 0.5) && Math.floor(currentTime) % 2 === 0 && currentTime - this.lastSpawnTime40 >= 2)) {
    let st = 40
    let startVar;
    let endVar;
    let startVar2;
    let endVar2;
    if (Math.random() < 0.5) {
        startVar = vec3(st, 0, -60);
        endVar = vec3(st, 0, 60);
        startVar2 = vec3(-1 * st, 0, 60);
        endVar2 = vec3(-1 * st, 0, -60);
    }
    else {
        startVar = vec3(st, 0, 60);
        endVar = vec3(st, 0, -60);
        startVar2 = vec3(-1 * st, 0, -60);
        endVar2 = vec3(-1 * st, 0, 60);
    }
    const path = { start: startVar, end: endVar, speed: 0.5 };
    const path2 = { start: startVar2, end: endVar2, speed: 0.5 };
    const type = getRandomVehicleType()
    const type2 = getRandomVehicleType()

    let vehicle;
    let randomNum = getRandomInt(1, 3)
    switch (type) {
        case 'Car':
            if (randomNum == 1) {
                vehicle = new defs.Car(this.redcar_materials, path, this.car_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle = new defs.Car(this.greencar_materials, path, this.car_shapes, currentTime);
            }
            else {
                vehicle = new defs.Car(this.bluecar_materials, path, this.car_shapes, currentTime);
            } break;
        case 'Van':
            if (randomNum == 1) {
                vehicle = new defs.Van(this.redvan_materials, path, this.van_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle = new defs.Van(this.greenvan_materials, path, this.van_shapes, currentTime);
            }
            else {
                vehicle = new defs.Van(this.bluevan_materials, path, this.van_shapes, currentTime);
            }
            break;
        case 'Starship':
            vehicle = new defs.Starship(this.starship_materials, path, this.starship_shapes, currentTime);
            break;
    }
    this.vehicle_manager.add_vehicle(vehicle);

    let vehicle2;
    switch (type2) {
        case 'Car':
            if (randomNum == 1) {
                vehicle2 = new defs.Car(this.redcar_materials, path2, this.car_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle2 = new defs.Car(this.greencar_materials, path2, this.car_shapes, currentTime);
            }
            else {
                vehicle2 = new defs.Car(this.bluecar_materials, path2, this.car_shapes, currentTime);
            } break;
        case 'Van':
            if (randomNum == 1) {
                vehicle2 = new defs.Van(this.redvan_materials, path2, this.van_shapes, currentTime);
            }
            else if (randomNum == 2) {
                vehicle2 = new defs.Van(this.greenvan_materials, path2, this.van_shapes, currentTime);
            }
            else {
                vehicle2 = new defs.Van(this.bluevan_materials, path2, this.van_shapes, currentTime);
            }
            break;
        case 'Starship':
            vehicle2 = new defs.Starship(this.starship_materials, path2, this.starship_shapes, currentTime);
            break;
    }
    this.vehicle_manager.add_vehicle(vehicle2);


    this.lastSpawnTime40 = currentTime; // Update last spawn time

}







this.vehicle_manager.update_and_draw(context, program_state);


    }
}

class Gouraud_Shader extends Shader { //edit here?
    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_poss_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;

        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_poss_or_vectors[i].xyz - 
                                               light_poss_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() { //NOT SURE IF THIS IS RIGHT
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;

                vertex_color = vec4(shape_color.xyz * ambient, shape_color.w);
                vertex_color.xyz += phong_model_lights(N, vertex_worldspace);
            } `;
    }

    fragment_glsl_code() { //NOT SURE IF THIS IS RIGHT
        return this.shared_glsl_code() + `
            void main(){
                gl_FragColor = vertex_color;
                return;
            } `;
    }

    send_material(gl, gpu, material) {

        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);

        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_poss_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_poss_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_poss_or_vectors, light_poss_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = { color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40 };
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);
          point_position = model_transform * vec4(position, 1.0);
          gl_Position = projection_camera_model_transform * vec4(position, 1.0);          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        return this.shared_glsl_code() + `
        void main(){
            float frequency_multiplier = 30.0; 
            float scalar = sin(frequency_multiplier * distance(point_position.xyz, center.xyz));
            vec4 band_color = vec4(0.65, 0.42, 0.18, 1.0); // Adjusted color for a different shade
            gl_FragColor = scalar * band_color;
        }`;
    }
}